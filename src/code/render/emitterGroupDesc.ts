import * as THREE from 'three'
import { CFrame, Color3, ColorSequence, Instance, NumberRange, NumberSequence, NumberSequenceKeypoint, Vector2, Vector3 } from "../rblx/rbx";
import { DisposableDesc, RenderDesc } from "./renderDesc";
import { API } from '../api';
import { rad, specialClamp } from '../misc/misc';
import { getRendererCamera } from './renderer';
import { NormalId, ParticleEmitterShapeInOut, ParticleOrientation } from '../rblx/constant';
import { particle_fragmentShader, particle_vertexShader } from './shaders/particleShader';

function randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min
}

function randomVelocity(speed: number, spread: Vector2) {
	const theta = spread.X
	const phi = spread.Y

    const velocity = new Vector3(
        speed * Math.sin(phi) * Math.cos(theta),
        speed * Math.sin(phi) * Math.sin(theta),
        speed * Math.cos(phi)
    )

	return velocity
}

class Particle {
    lifetime: number
    time: number = 0

    position: Vector3
    rotation: number

    velocity: Vector3
    rotationSpeed: number
    
    seed: number = Math.random()

    constructor(lifetime: number, position: Vector3, rotation: number, velocity: Vector3, rotationSpeed: number) {
        this.lifetime = lifetime
        this.position = position
        this.rotation = rotation
        this.velocity = velocity
        this.rotationSpeed = rotationSpeed
    }

    camDistance(): number {
        const cameraPos = new Vector3(...getRendererCamera().position.toArray())
        const particlePos = this.position

        const distance = cameraPos.minus(particlePos).magnitude()
        return distance
    }

    getMatrix(size: number, orientation: number): THREE.Matrix4 {
        const camera = getRendererCamera()

        const particlePos = new THREE.Vector3(...this.position.toVec3())

        const translation = new THREE.Matrix4().makeTranslation(particlePos)
        const scale = new THREE.Matrix4().makeScale(size,size,1)

        switch (orientation) {
            case ParticleOrientation.FacingCameraWorldUp:
                {
                    const cameraLookVector = new THREE.Vector3()
                    camera.getWorldDirection(cameraLookVector)
                    const rotationParticlePosMatrix = new THREE.Matrix4().lookAt(new THREE.Vector3(0,0,0), new THREE.Vector3(0,1,0), cameraLookVector)

                    const _pos = new THREE.Vector3()
                    const _scale = new THREE.Vector3()
                    const rotationQuat = new THREE.Quaternion()
                    rotationParticlePosMatrix.decompose(_pos, rotationQuat, _scale)

                    const rotation = new THREE.Matrix4().makeRotationFromQuaternion(rotationQuat)
                    const flatRotation = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0,0,1), rad(this.rotation))
                    const offsetRotation = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1,0,0), rad(-90))
                    const offset2Rotation = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0,1,0), rad(180))

                    const final = translation.multiply(rotation).multiply(offsetRotation).multiply(offset2Rotation).multiply(flatRotation).multiply(scale)

                    return final
                }
            case ParticleOrientation.VelocityPerpendicular:
                {
                    const normalizedVelocity = new THREE.Vector3(...this.velocity.normalize().toVec3())
                    const rotationParticlePosMatrix = new THREE.Matrix4().lookAt(new THREE.Vector3(0,0,0), normalizedVelocity, new THREE.Vector3(0,1,0))

                    const _pos = new THREE.Vector3()
                    const _scale = new THREE.Vector3()
                    const rotationQuat = new THREE.Quaternion()
                    rotationParticlePosMatrix.decompose(_pos, rotationQuat, _scale)

                    const rotation = new THREE.Matrix4().makeRotationFromQuaternion(rotationQuat)
                    const flatRotation = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0,0,1), rad(this.rotation))

                    const final = translation.multiply(rotation).multiply(flatRotation).multiply(scale)

                    return final
                }
            case ParticleOrientation.VelocityParallel:
                {
                    const normalizedVelocity = new THREE.Vector3(...this.velocity.normalize().toVec3())
                    const rotationParticlePosMatrix = new THREE.Matrix4().lookAt(particlePos, camera.position, normalizedVelocity)

                    const _pos = new THREE.Vector3()
                    const _scale = new THREE.Vector3()
                    const rotationQuat = new THREE.Quaternion()
                    rotationParticlePosMatrix.decompose(_pos, rotationQuat, _scale)

                    const rotation = new THREE.Matrix4().makeRotationFromQuaternion(rotationQuat)
                    const flatRotation = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0,0,1), rad(this.rotation + 90))

                    const final = translation.multiply(rotation).multiply(flatRotation).multiply(scale)

                    return final
                }
            case ParticleOrientation.FacingCamera:
            default:
                {
                    const rotation = new THREE.Matrix4().makeRotationFromQuaternion(camera.quaternion)

                    const flatRotation = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0,0,1), rad(this.rotation))
                    const final = translation.multiply(rotation).multiply(flatRotation).multiply(scale)

                    return final
                }
        }
    }

    tick(dt: number, drag: number, acceleration: Vector3) {
        this.time += specialClamp(dt,0,this.lifetime)

        this.position = this.position.add(this.velocity.multiply(new Vector3(dt,dt,dt)))

        const accMult = 0.5 * Math.pow(dt, 2)
        this.position = this.position.add(acceleration.multiply(new Vector3(accMult, accMult, accMult)))

        this.velocity = this.velocity.add(acceleration.multiply(new Vector3(dt,dt,dt)))

        const dragVal = Math.pow(2, -drag * dt)
        this.velocity = this.velocity.multiply(new Vector3(dragVal, dragVal, dragVal))

        this.rotation += this.rotationSpeed * dt
    }
}

class EmitterDesc extends DisposableDesc {
    passedTime: number = 0

    lifetime: NumberRange = new NumberRange(1,1)
    rate: number = 10
    spreadAngle: Vector2 = new Vector2(0,0)

    speed: NumberRange = new NumberRange(1,1)
    rotation: NumberRange = new NumberRange(0,0)
    rotationSpeed: NumberRange = new NumberRange(0,0)
    localAcceleration: Vector3 = new Vector3(0,0,0)
    acceleration: Vector3 = new Vector3(0,0,0)
    drag: number = 0
    timeScale: number = 1

    orientation: number = ParticleOrientation.FacingCamera
    zOffset: number = 0
    offset: Vector3 = new Vector3()
    shapeInOut: number = 0

    colorTexture?: string
    alphaTexture?: string
    texture?: string

    opacity: number = 1
    lightEmission: number = 1
    blending: THREE.Blending = THREE.AdditiveBlending

    color: ColorSequence = new ColorSequence()
    size: NumberSequence = new NumberSequence()
    transparency: NumberSequence = new NumberSequence([new NumberSequenceKeypoint(0,0,0)])
    normalizeSizeKeypointTime: boolean = true

    instanceOpacityBuffer?: THREE.InstancedBufferAttribute
    instanceColorBuffer?: THREE.InstancedBufferAttribute
    instanceSeedTimeBuffer?: THREE.InstancedBufferAttribute
    result?: THREE.InstancedMesh
    particles: Particle[] = []

    get maxCount() {
        return Math.max(Math.ceil(this.lifetime.Max * this.rate) * 2, 1)
    }

    isSame(other: EmitterDesc) {
        return this.lifetime.isSame(other.lifetime) &&
            this.rate === other.rate &&
            this.texture === other.texture
    }

    dispose(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
        const mesh = this.result
        if (mesh) {
            this.disposeMesh(scene, mesh)
            this.disposeRenderLists(renderer)
        }
    }

    async getTexture(texture?: string, colorSpace: THREE.ColorSpace = THREE.SRGBColorSpace): Promise<THREE.Texture | undefined> {
        if (texture) {
            const source = texture.replace(".dds", ".png")

            const image = await API.Generic.LoadImage(source)
            if (image) {
                const texture = new THREE.Texture(image)
                texture.wrapS = THREE.ClampToEdgeWrapping
                texture.wrapT = THREE.ClampToEdgeWrapping
                texture.colorSpace = colorSpace
                
                texture.needsUpdate = true
                
                return texture
            }
        }

        return undefined
    }

    async compileResult(renderer: THREE.WebGLRenderer, scene: THREE.Scene): Promise<THREE.Mesh | Response | undefined> {
        const originalResult = this.result

        const texturePromises = [
            this.getTexture(this.texture),
            this.getTexture(this.alphaTexture, THREE.NoColorSpace),
            this.getTexture(this.colorTexture)
        ]

        let [mapToUse, alphaMapToUse, colorMapToUse] = await Promise.all(texturePromises)

        if (!mapToUse) {
            mapToUse = new THREE.DataTexture(new Uint8Array([0,0,0,0]), 1, 1, THREE.RGBAFormat)
            mapToUse.needsUpdate = true
        }
        if (!alphaMapToUse) {
            alphaMapToUse = new THREE.DataTexture(new Uint8Array([255,255,255,255]), 1, 1, THREE.RGBAFormat)
            alphaMapToUse.needsUpdate = true
        }
        if (!colorMapToUse) {
            colorMapToUse = new THREE.DataTexture(new Uint8Array([255,255,255,255]), 1, 1, THREE.RGBAFormat)
            colorMapToUse.needsUpdate = true
        }

        const geometry = new THREE.PlaneGeometry(2,2)

        this.instanceColorBuffer = new THREE.InstancedBufferAttribute(new Float32Array(this.maxCount * 3), 3)
        geometry.setAttribute("instanceColor", this.instanceColorBuffer)
        this.instanceOpacityBuffer = new THREE.InstancedBufferAttribute(new Float32Array(this.maxCount), 1)
        geometry.setAttribute("instanceOpacity", this.instanceOpacityBuffer)
        this.instanceSeedTimeBuffer = new THREE.InstancedBufferAttribute(new Float32Array(this.maxCount), 2)
        geometry.setAttribute("instanceSeedTime", this.instanceSeedTimeBuffer)

        const material = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: this.blending,
            opacity: this.opacity,

            vertexShader: particle_vertexShader,
            fragmentShader: particle_fragmentShader,
            uniforms: {
                uMap: { value: mapToUse },
                uAlphaMap: { value: alphaMapToUse },
                uColorMap: { value: colorMapToUse },

                uOpacity: { value: this.opacity },
                uZOffset: { value: this.zOffset },
            },
        })
        
        this.result = new THREE.InstancedMesh(geometry, material, this.maxCount)
        this.result.frustumCulled = false

        if (originalResult) {
            this.disposeMesh(scene, originalResult)
            this.disposeRenderLists(renderer)
        }

        return this.result
    }

    emit(groupDesc: EmitterGroupDesc) {
        if (this.particles.length >= this.maxCount) {
            return
        }

        const speed = randomBetween(this.speed.Min, this.speed.Max)
        const spreadX = rad(randomBetween(-Math.abs(this.spreadAngle.X), Math.abs(this.spreadAngle.X)))
        const spreadY = rad(randomBetween(-Math.abs(this.spreadAngle.Y), Math.abs(this.spreadAngle.Y)))
        const spread = new Vector2(spreadX, spreadY)

        let velocityMultiplierScalar = 1
        if (this.shapeInOut === ParticleEmitterShapeInOut.Inward) {
            velocityMultiplierScalar = -1
        } else if (this.shapeInOut === ParticleEmitterShapeInOut.InAndOut) {
            velocityMultiplierScalar = Math.random() > 0.5 ? 1 : -1
        }
        const velocityMultiplier = new THREE.Vector3(velocityMultiplierScalar,velocityMultiplierScalar,velocityMultiplierScalar)

        const velocityFront = randomVelocity(speed, spread)
        const velocityOriginal = new THREE.Vector3(...velocityFront.toVec3()).multiply(velocityMultiplier)
        const velocityLocal = velocityOriginal.applyQuaternion(groupDesc.getNormalQuaternionForVelocity())
        
        const worldVelocity = velocityLocal.applyQuaternion(new THREE.Quaternion().setFromRotationMatrix(groupDesc.cframe.getTHREEMatrix()))
        const worldVelocityRoblox = new Vector3(...worldVelocity.toArray())

        const particle = new Particle(
            randomBetween(this.lifetime.Min, this.lifetime.Max),
            groupDesc.getRandomWorldPos().add(this.offset),
            randomBetween(this.rotation.Min, this.rotation.Max),
            worldVelocityRoblox,
            randomBetween(this.rotationSpeed.Min, this.rotationSpeed.Max)
        )
        
        this.particles.push(particle)
    }

    tick(dt: number, groupDesc: EmitterGroupDesc) {
        this.passedTime += dt * this.timeScale

        //tick particles
        for (const particle of this.particles) {
            const localAccelerationCF = new CFrame(...this.localAcceleration.toVec3())
            const rotatedWorldCF = groupDesc.cframe.clone()
            rotatedWorldCF.Position = [0,0,0]
            const localAccelerationToWorldCF = rotatedWorldCF.multiply(localAccelerationCF)
            const localAccelerationToWorld = new Vector3(...localAccelerationToWorldCF.Position)

            particle.tick(dt * this.timeScale, this.drag, this.acceleration.add(localAccelerationToWorld))
        }

        //destroy old particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i]
            if (particle.time >= particle.lifetime) {
                this.particles.splice(i,1)
            }
        }

        //emit particles
        this.passedTime = specialClamp(this.passedTime, 0, 5)
        while (this.passedTime >= 1 / this.rate) {
            this.emit(groupDesc)
            this.passedTime -= 1 / this.rate
        }

        //sort particles
        this.particles.sort((a, b) => {
            return b.camDistance() - a.camDistance()
        })
    }

    updateResult() {
        if (!this.result || !this.instanceColorBuffer || !this.instanceOpacityBuffer || !this.instanceSeedTimeBuffer) return
        this.result.count = this.particles.length

        for (let i = 0; i < this.result.count; i++) {
            const particle = this.particles[i]

            const time = particle.time
            const normalizedTime = particle.time / particle.lifetime

            const color = this.color.getValue(normalizedTime)
            const size = this.size.getValue(this.normalizeSizeKeypointTime ? normalizedTime : time, particle.seed + 0)
            const opacity = 1 - this.transparency.getValue(normalizedTime, particle.seed + 1)

            this.result.setMatrixAt(i, particle.getMatrix(size, this.orientation))
            this.instanceColorBuffer.setXYZ(i, color.R, color.G, color.B)
            this.instanceOpacityBuffer.setX(i, opacity)
            this.instanceSeedTimeBuffer.setXY(i, particle.seed, normalizedTime)
        }

        this.result.instanceMatrix.needsUpdate = true
        this.instanceColorBuffer.needsUpdate = true
        this.instanceOpacityBuffer.needsUpdate = true
        this.instanceSeedTimeBuffer.needsUpdate = true
    }
}

export class EmitterGroupDesc extends RenderDesc {
    lastTime: number = Date.now() / 1000
    time: number = Date.now() / 1000

    lowerBound: Vector3 = new Vector3(0,0,0)
    higherBound: Vector3 = new Vector3(0,0,0)

    cframe: CFrame = new CFrame()
    emitterDir: number = NormalId.Top

    emitterDescs: EmitterDesc[] = []

    //special for emitter group
    getRandomLocalPos(): Vector3 {
        const totalSize = this.higherBound.minus(this.lowerBound)

        const x = Math.random() * totalSize.X + this.lowerBound.X
        const y = Math.random() * totalSize.Y + this.lowerBound.Y
        const z = Math.random() * totalSize.Z + this.lowerBound.Z

        return new Vector3(x,y,z)
    }

    toWorldSpace(vec: Vector3): Vector3 {
        const vecAsCF = new CFrame(...vec.toVec3())

        const worldSpace = new Vector3().fromVec3(this.cframe.multiply(vecAsCF).Position)

        return worldSpace
    }

    getRandomWorldPos(): Vector3 {
        const randomWorldPos = this.toWorldSpace(this.getRandomLocalPos())
        
        return randomWorldPos
    }

    getNormalQuaternionForVelocity() {
        switch (this.emitterDir) {
            case NormalId.Right:
                {
                    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), new THREE.Vector3(1,0,0))
                }
            case NormalId.Top:
                {
                    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), new THREE.Vector3(0,1,0))
                }
            case NormalId.Back:
                {
                    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), new THREE.Vector3(0,0,1))
                }
            case NormalId.Left:
                {
                    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), new THREE.Vector3(-1,0,0))
                }
            case NormalId.Bottom:
                {
                    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), new THREE.Vector3(0,-1,0))
                }
            case NormalId.Front:
            default:
                {
                    return new THREE.Quaternion()
                }
        }
    }

    createEmitter(config: Partial<EmitterDesc>): EmitterDesc {
        const emitter = new EmitterDesc()
        Object.assign(emitter, config)
        return emitter
    }

    //inherited from RenderDesc
    isSame(other: EmitterGroupDesc): boolean {
        if (this.needsRegeneration(other)) {
            return false
        }

        if (this.time !== other.time) {
            return false
        }

        return true
    }

    needsRegeneration(other: EmitterGroupDesc): boolean {
        if (this.emitterDescs.length !== other.emitterDescs.length) {
            return true
        }

        for (let i = 0; i < this.emitterDescs.length; i++) {
            if (!this.emitterDescs[i].isSame(other.emitterDescs[i])) {
                return true
            }
        }

        return false
    }

    virtualFromRenderDesc(other: EmitterGroupDesc) {
        //everything that doesnt require compilation should be here
        this.time = other.time
        this.cframe = other.cframe
        this.lowerBound = other.lowerBound
        this.higherBound = other.higherBound
        this.emitterDir = other.emitterDir
    }

    fromInstance(child: Instance) {
        this.instance = child

        const parent = child.parent
        if (parent) {
            //get cframe
            if (parent.HasProperty("CFrame")) {
                this.cframe = parent.Prop("CFrame") as CFrame

                //check for attachment
                if (parent.className === "Attachment") {
                    const parentParent = parent.parent
                    if (parentParent && parentParent.HasProperty("CFrame")) {
                        this.cframe = (parentParent.Prop("CFrame") as CFrame).multiply(this.cframe)
                    }
                }
            }

            //get emit bounds
            if (parent.HasProperty("Size") || parent.HasProperty("size")) {
                const size = parent.Prop("Size") as Vector3
                this.higherBound = size.multiply(new Vector3(0.5,0.5,0.5))
                this.lowerBound = size.multiply(new Vector3(-0.5,-0.5,-0.5))
            }
        }

        const className = child.className

        switch (className) {
            case "ParticleEmitter":
                this.fromParticleEmitter(child)
                break
            case "Sparkles":
                this.fromSparkles(child)
                break
            case "Fire":
                this.fromFire(child)
                break
            case "Smoke":
                this.fromSmoke(child)
                break
        }
    }

    fromParticleEmitter(child: Instance) {
        this.emitterDir = child.Prop("EmissionDirection") as number

        const emitterDesc = new EmitterDesc()
        if (child.HasProperty("Lifetime"))  emitterDesc.lifetime = child.Prop("Lifetime") as NumberRange
        if (child.HasProperty("Rate")) emitterDesc.rate = child.Prop("Rate") as number
        if (child.HasProperty("SpreadAngle")) emitterDesc.spreadAngle = child.Prop("SpreadAngle") as Vector2

        if (child.HasProperty("ShapeInOut")) emitterDesc.shapeInOut = child.Prop("ShapeInOut") as number

        if (child.HasProperty("Speed")) emitterDesc.speed = child.Prop("Speed") as NumberRange
        if (child.HasProperty("Rotation")) emitterDesc.rotation = child.Prop("Rotation") as NumberRange
        if (child.HasProperty("RotSpeed")) emitterDesc.rotationSpeed = child.Prop("RotSpeed") as NumberRange
        if (child.HasProperty("Acceleration")) emitterDesc.acceleration = child.Prop("Acceleration") as Vector3
        if (child.HasProperty("Drag")) emitterDesc.drag = child.Prop("Drag") as number
        if (child.HasProperty("TimeScale")) emitterDesc.timeScale = child.Prop("TimeScale") as number

        if (child.HasProperty("Size")) emitterDesc.size = child.Prop("Size") as NumberSequence
        if (child.HasProperty("Color")) emitterDesc.color = child.Prop("Color") as ColorSequence
        if (child.HasProperty("Texture")) emitterDesc.texture = child.Prop("Texture") as string
        if (child.HasProperty("Transparency")) emitterDesc.transparency = child.Prop("Transparency") as NumberSequence
        if (child.HasProperty("LightEmission")) emitterDesc.lightEmission = child.Prop("LightEmission") as number
        emitterDesc.blending = emitterDesc.lightEmission === 0 ? THREE.NormalBlending : THREE.AdditiveBlending
        if (child.HasProperty("ZOffset")) emitterDesc.zOffset = child.Prop("ZOffset") as number
        if (child.HasProperty("Orientation")) emitterDesc.orientation = child.Prop("Orientation") as number

        this.emitterDescs.push(emitterDesc)
    }

    fromSparkles(child: Instance) {
        this.lowerBound = new Vector3(-0.2, -0.2, -0.2)
        this.higherBound = new Vector3(0.2, 0.2, 0.2)

        const color = child.PropOrDefault("SparkleColor", new Color3(144 / 255, 25 / 255, 255 / 255)) as Color3

        //big sparkles
        this.emitterDescs.push(this.createEmitter({
            texture: "rbxasset://textures/particles/sparkles_main.dds",
            alphaTexture: "rbxasset://textures/particles/common_alpha.dds",
            colorTexture: "rbxasset://textures/particles/sparkles_color.dds",
            drag: 0.2,
            size: new NumberSequence([new NumberSequenceKeypoint(0, 0.37, 0), new NumberSequenceKeypoint(1, 0.37 + 0.65, 0)]),
            speed: new NumberRange(5,5),
            rotation: new NumberRange(-90, 90),
            rotationSpeed: new NumberRange(40, 100),
            spreadAngle: new Vector2(100,100),
            rate: 30,
            lifetime: new NumberRange(1.3, 1.3),
            timeScale: child.PropOrDefault("TimeScale", 1) as number,
            color: ColorSequence.fromColor(color)
        }))
        
        //tiny sparkles
        this.emitterDescs.push(this.createEmitter({
            texture: "rbxasset://textures/particles/sparkles_main.dds",
            alphaTexture: "rbxasset://textures/particles/common_alpha.dds",
            drag: 2,
            size: new NumberSequence([new NumberSequenceKeypoint(0, 0.1, 0), new NumberSequenceKeypoint(1, 0.1 + 0.34, 0)]),
            speed: new NumberRange(8,8),
            rotation: new NumberRange(-90, 90),
            rotationSpeed: new NumberRange(-500, 500),
            spreadAngle: new Vector2(150,150),
            rate: 5,
            lifetime: new NumberRange(1.7, 1.7),
            timeScale: child.PropOrDefault("TimeScale", 1) as number,
            color: ColorSequence.fromColor(color)
        }))
    }

    fromFire(child: Instance) {
        const size = child.PropOrDefault("size_xml", 3) as number / 3.5
        const boundSize = size / 8
        const heat = child.PropOrDefault("heat_xml", 5) as number
        const timeScale = child.PropOrDefault("TimeScale", 1) as number

        const color = child.PropOrDefault("Color", new Color3(236 / 255, 139 / 255, 70 / 255)) as Color3
        const secondaryColor = child.PropOrDefault("SecondaryColor", new Color3(106 / 255, 44 / 255, 13 / 255)) as Color3
        this.lowerBound = new Vector3(-boundSize, -boundSize, -boundSize)
        this.higherBound = new Vector3(boundSize, boundSize, boundSize)

        const strongColor = color.clone()
        strongColor.R *= 4
        strongColor.G *= 4
        strongColor.B *= 4

        this.emitterDescs.push(this.createEmitter({
            texture: "rbxasset://textures/particles/fire_main.dds",
            alphaTexture: "rbxasset://textures/particles/fire_alpha.dds",
            drag: 0.4,
            localAcceleration: new Vector3(0,0.5 * (1*size*size/4 + 0.7*heat),0),
            rotation: new NumberRange(-90,90),
            size: new NumberSequence([new NumberSequenceKeypoint(0, 1.1*size, 0), new NumberSequenceKeypoint(2, Math.max(1.1*size - 0.8*size*2, 0), 0)]),
            speed: new NumberRange(0.4*(0.2*size*size + 0.2 * heat), 0.4*(0.2*size*size + 0.2 * heat)),
            rotationSpeed: new NumberRange(100,100),
            spreadAngle: new Vector2(10,10),
            rate: 65,
            lifetime: new NumberRange(1,2),
            normalizeSizeKeypointTime: false,
            timeScale: timeScale,
            color: ColorSequence.fromColor(strongColor),
        }))

        //this.lowerBound = new Vector3(-boundSize * 2, -boundSize * 2, -boundSize * 2)
        //this.higherBound = new Vector3(boundSize * 2, boundSize * 2, boundSize * 2)

        this.emitterDescs.push(this.createEmitter({
            texture: "rbxasset://textures/particles/fire_sparks_main.dds",
            alphaTexture: "rbxasset://textures/particles/common_alpha.dds",
            drag: 0.4,
            acceleration: new Vector3(0,0.5 * (1 * size * size / 4 + 0.7 * heat),0),
            rotation: new NumberRange(-90,90),
            size: new NumberSequence([new NumberSequenceKeypoint(0, 1.1*size, 0), new NumberSequenceKeypoint(2, Math.max(1.1 * size - (-size * 0.2 / 2) * 2, 0), 0)]),
            speed: new NumberRange(0.4 * (0.2 * size * size + 0.2 * heat), 0.4 * (0.2 * size * size + 0.2 * heat)),
            rotationSpeed: new NumberRange(100,100),
            spreadAngle: new Vector2(10,10),
            rate: 65,
            lifetime: new NumberRange(1,2),
            normalizeSizeKeypointTime: false,
            timeScale: timeScale,
            color: ColorSequence.fromColor(secondaryColor),
            offset: new Vector3(0, 3 * (0.3 * size + 0.05 * heat), 0)
        }))
    }

    fromSmoke(child: Instance) {
        const size = child.PropOrDefault("size_xml", 1) as number
        const endSize = 10 + size
        const timeScale = child.PropOrDefault("TimeScale", 1) as number
        const riseVelocity = child.PropOrDefault("riseVelocity_xml", 1) as number
        const opacity = child.PropOrDefault("opacity_xml", 0.5) as number
        const color = child.PropOrDefault("Color", new Color3(1,1,1)) as Color3

        this.emitterDescs.push(this.createEmitter({
            texture: "rbxasset://textures/particles/smoke_main.dds",
            alphaTexture: "rbxasset://textures/particles/common_alpha.dds",
            drag: 0.1,
            opacity: opacity,
            acceleration: new Vector3(0, 0, 0.4),
            size: new NumberSequence([new NumberSequenceKeypoint(0, size, 0), new NumberSequenceKeypoint(1, endSize, 0)]),
            rotation: new NumberRange(-90, 90),
            speed: new NumberRange(riseVelocity * 0.9, riseVelocity * 1),
            rotationSpeed: new NumberRange(-20, 20),
            spreadAngle: new Vector2(30,30),
            rate: 7,
            lifetime: new NumberRange(5,5),
            timeScale: timeScale,
            color: ColorSequence.fromColor(color),
            blending: THREE.NormalBlending
        }))
    }

    dispose(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
        const meshes = this.results
        if (meshes) {
            this.disposeMeshes(scene, meshes)
            this.disposeRenderLists(renderer)
        }
    }

    async compileResults(renderer: THREE.WebGLRenderer, scene: THREE.Scene): Promise<THREE.Mesh[] | Response | undefined> {
        const originalResults = this.results

        //create result promises
        const resultPromises: Promise<THREE.Mesh | Response | undefined>[] = []
        for (const emitterDesc of this.emitterDescs) {
            resultPromises.push(emitterDesc.compileResult(renderer, scene))
        }

        //use promises
        this.results = []

        const compiledResults = await Promise.all(resultPromises)
        for (const compiledResult of compiledResults) {
            if (compiledResult instanceof THREE.Mesh) {
                this.results.push(compiledResult)
            } else { //failed to compile results, cancel everything
                this.disposeMeshes(scene, this.results)
                this.disposeRenderLists(renderer)
                return compiledResult
            }
        }

        if (originalResults) {
            this.disposeMeshes(scene, originalResults)
            this.disposeRenderLists(renderer)
        }

        return this.results
    }

    updateResults() {
        const dt = specialClamp(this.time - this.lastTime, 0, 1 / 10)
        this.lastTime = this.time
        
        for (const emitterDesc of this.emitterDescs) {
            emitterDesc.tick(dt, this)
            emitterDesc.updateResult()
        }
    }
}
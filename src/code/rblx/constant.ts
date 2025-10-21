export const magic = "<roblox!"
export const xmlMagic = "<roblox "

export const MeshType = {
    "Brick": 6,
    "Cylinder": 4,
    "FileMesh": 5,
    "Head": 0,
    "Sphere": 3,
    "Torso": 1,
    "Wedge": 2,
}

export const DataType = {
    "String": 0x01,
    "Bool": 0x02,
    "Int32": 0x03,
    "Float32": 0x04,
    "Float64": 0x05,
    "UDim": 0x06,
    "UDim2": 0x07,
    "Ray": 0x08,
    "Faces": 0x09, //NOT IMPLEMENTED
    "Axes": 0x0a, //NOT IMPLEMENTED
    "BrickColor": 0x0b,
    "Color3": 0x0c,
    "Vector2": 0x0d, //NOT IMPLEMENTED
    "Vector3": 0x0e,
    "CFrame": 0x10,
    "Enum": 0x12,
    "Referent": 0x13,

    "Color3uint8": 0x1a,
    "Int64": 0x1b,

    "Capabilites": 0x21, //NOT IMPLEMENTED
}

export const PropertyTypeInfo = {
    "Pants": {
        "PantsTemplate": "String",
        "Name": "String",
        "archiveable": "Bool"
    },
    "Shirt": {
        "ShirtTemplate": "String",
        "Name": "String",
        "archiveable": "Bool"
    },
    "ShirtGraphic": {
        "Graphic": "String",
        "Name": "String",
        "archiveable": "Bool"
    }
}
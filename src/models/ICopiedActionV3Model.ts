export interface ICopiedActionV3Model {
    "nodeId": string;
    "operationInfo": {
        "connectorId": string;
        "operationId": string;//"GetItems",
        "type": string;//"OpenApiConnection"
    };
    "nodeData": {
        "id": string;//"Get_items_copy",
        "nodeInputs": any;
        "nodeOutputs": any;
        "nodeDependencies": any;
        "operationMetadata": {
            "iconUri": string;//"https://connectoricons-prod.azureedge.net/releases/v1.0.1664/1.0.1664.3477/sharepointonline/icon.png",
            "brandColor": string; //"#036C70"
        },
        "settings": any;
        "actionMetadata": {
            "operationMetadataId": string;//"8a88d1af-0188-4d0e-9853-dcc4cbe5ee6e"
        },
        "repetitionInfo": {
            "repetitionReferences": any[];
        }
    };
    "connectionData": string;
}
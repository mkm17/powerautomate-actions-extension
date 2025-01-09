export interface ICopiedActionV3Model {
    "nodeId": string;
    "operationInfo": {
        "connectorId": string;
        "operationId": string;
        "type": string;
    };
    "nodeData": {
        "id": string;
        "nodeInputs": any;
        "nodeOutputs": any;
        "nodeDependencies": any;
        "operationMetadata": {
            "iconUri": string;
            "brandColor": string;
        },
        "settings": any;
        "actionMetadata": {
            "operationMetadataId": string;
        },
        "repetitionInfo": {
            "repetitionReferences": any[];
        }
    };
    "connectionData": string;
}
export interface IActionBody {
    nodeId: string;
    serializedValue: {
        type: string;
        actions: any,
        runAfter: {},
        metadata: any
    },
    allConnectionData: {
    },
    staticResults: {};
    isScopeNode: boolean;
    mslaNode: boolean;
}

export interface IActionBody {
    nodeId: string;
    serializedOperation: {
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

export declare enum PropertyType {
    Object = "object",
    Array = "array",
    Primitive = "primitive"
}
export declare class PropertyInfo {
    name?: string;
    type?: PropertyType;
    index?: number;
    constructor(field: string | number, type?: PropertyType);
    clone(): PropertyInfo;
    getFieldId(): string | number;
    getField(): string;
    getIndex(): number;
    static parse(pathPart: string): PropertyInfo;
    getName(): string;
    isIndex(): boolean;
    isName(): boolean;
    setField(field: string | number): void;
}
export interface IMFormChangeEvent {
    sourceNode: MFormNode;
    value: any;
    error: string;
    convertToArrayOfNodes?: boolean;
}
export interface IFramework {
    push(array: MFormNode[], result: MFormNode): void;
    createProperty(dst: any, fieldName: string, propertyValue: any): void;
    emit(name: string, value: any): void;
}
export interface IRModel {
    change(value: any): void;
    setError(value: any, message: string): void;
    value(): any;
    member(fieldName: string): IRModel;
    error(): string;
    c_array(): Array<MFormNode>;
    setAsArray(a?: Array<any>): void;
    push(): MFormNode;
}
declare class InnerData {
    field: PropertyInfo;
    parent: MFormNode | null;
    _error: string;
    bus: IFramework;
    isMFormNode: boolean;
    children: {
        [key: string]: MFormNode;
    };
    primitiveValue: any;
    array: Array<MFormNode> | null;
    static isNode(obj: any): boolean;
    isUndefined(): boolean;
    isArray(): boolean;
    isPrimitive(): boolean;
    getParent(): MFormNode;
    constructor(frm: IFramework, parent?: MFormNode);
}
export declare class MFormNode implements IRModel {
    _data: InnerData;
    constructor(bus: IFramework, parent?: MFormNode);
    isRoot(): boolean;
    isDefined(): boolean;
    hasProperty(p: string | number): boolean;
    private createUndefinedProperty;
    private setPrimitiveValue;
    getRoot(): MFormNode;
    getPath(): PropertyInfo[];
    getStringPath(): string;
    hasChildren(): boolean;
    getOrCreateField(field: PropertyInfo): MFormNode;
    onModelChange(ev: IMFormChangeEvent): void;
    change(value: any): void;
    value(): any;
    c_array(): MFormNode[];
    private static getType;
    setAsArray(a?: any): void;
    setError(value: any, message: string): void;
    error(): string;
    member(fieldName: string): IRModel;
    push(): MFormNode;
    buildObject(): void;
    static createPrimitiveNode(bus: IFramework, obj: any, parent: MFormNode): MFormNode;
    static createMFormTree(bus: IFramework, obj: any): MFormNode;
    static toPoco(obj: MFormNode): any;
}
export {};

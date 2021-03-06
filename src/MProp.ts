


export enum PropertyType {
  Object = "object",
  Array = "array",
  Primitive = "primitive"
}


export class PropertyInfo {
   name?:string;
   type?:PropertyType;
   index?:number;

  constructor(field:string|number,type?:PropertyType)
  {
    if (type) this.type=type;
    this.setField(field);
  }

  clone():PropertyInfo{
    return new PropertyInfo(this.getFieldId(),this.type);
  }
  getFieldId():string|number
  {
    if (this.name) return this.name;
    if (this.index) return this.index;
    throw "invalid field id";
  }

  getField():string {
    if (this.name)
      return this.name
   if (this.index)
    return this.index.toString()
   else
    return ''
  }

  getIndex():number {
      if (this.index)
        return this.index;
      else
        throw "field is not an index" 

  }

  static parse(pathPart:string):PropertyInfo
  {
    var intExp= /^-?[0-9]+$/g;
    if (pathPart.match(intExp) !=null)
    {
        var i:number = parseInt(pathPart);
        return new PropertyInfo(i);
    }
    else 
    {
        return new PropertyInfo(pathPart);
    }

  }

  getName():string {
    if (this.name)
      return this.name;
    throw "Field is an index not a name"  ;
    
  }

  isIndex():boolean {return this.index ? true: false};
  isName():boolean {return this.name ? true: false};
  setField(field:string|number)
    {
      if (typeof field == "number")
        {
          this.index=field;
          
        }
      else 
      {
        this.name=field;
        
      }      
    }
}

export interface IMFormChangeEvent {
  sourceNode:MFormNode;
  value:any;
  error:string;
  convertToArrayOfNodes?:boolean
}

export interface IFramework {
  push(array: MFormNode[], result: MFormNode):void;
    createProperty(dst:any,fieldName:string,propertyValue:any):void;
    emit(name:string,value:any):void;
}





export interface IRModel {
  change(value:any):void
  setError(value:any,message:string):void
  value():any
  member(fieldName:string):IRModel
  error():string;
  c_array():Array<MFormNode>
  setAsArray(a?:Array<any>):void
  push():MFormNode;
}

class InnerData {
    field:PropertyInfo
    parent:MFormNode|null;
    _error:string="";
    bus:IFramework;
    isMFormNode:boolean = true;
    children:{[key:string]:MFormNode}
    primitiveValue:any=null;
    array:Array<MFormNode>|null=null;
    
    static isNode(obj:any):boolean{
        return (obj && obj._data && obj._data.isMFormNode)
    }
    isUndefined():boolean {return this.field.type==null}
    isArray():boolean {return this.field.type == PropertyType.Array}
    isPrimitive():boolean {return this.field.type == PropertyType.Primitive}
    
    getParent():MFormNode {
      if (!this.parent) throw "Node has no parent" 
      return this.parent;
    }
    
    constructor(frm:IFramework,parent?:MFormNode)
    {
        this.field=new PropertyInfo('');
        this.isMFormNode=true;
        this.parent=parent ? parent : null;
        this.children={};
        this.bus=frm;
      }


}

export class MFormNode implements IRModel{
  
    _data: InnerData;
  

  
    constructor (bus:IFramework,parent?:MFormNode)
    {
        this._data = new InnerData(bus,parent);
    }


   isRoot():boolean {
    return this._data.parent == null;
  }

   isDefined():boolean
  {
    return this._data.field.type!=null;
  }


   hasProperty(p:string|number):boolean
  {
    return this.isDefined() && this._data.children[p] && this._data.children[p].isDefined();
  }

   private createUndefinedProperty(field: string|number): MFormNode {
    
    var result=new MFormNode(this._data.bus);
    result._data.field = new PropertyInfo(field)
    result._data.parent=this;
    result._data.children={};
    return result;
  }
  
 


  //Define the node as primitive
  private setPrimitiveValue(value:any)
  {
    if (this.hasChildren())
      throw `Can't set value at Node ${this.getStringPath()}, node has children`;
    
    if (this._data.field.type==null)
    {
      this._data.field.type=PropertyType.Primitive;
    }
    if (this._data.field.type==PropertyType.Primitive)
    {
      this._data.primitiveValue=value;
      
    }
    else
      throw `Error on set value for node ${this.getStringPath}, type is not primitive, it actually is  ${this._data.field.type}`
  }
  
  
   getRoot():MFormNode
  {
    var it:MFormNode=this;
    while(it._data.parent != null)
    {
      it=it._data.parent;
    }
    return it;
  }
   getPath():PropertyInfo[] 
  {
    var result:PropertyInfo[]= [];
    var it:MFormNode= this;
    while (!it.isRoot())
    {
      result.push(it._data.field.clone());
      it=it._data.getParent();
    }
    return result.reverse();
  }
  
   getStringPath():string {
    var path = this.getPath();
    var result="";
    
    path.forEach(p=>{
      if (p.getField())
          result+=p.getField()+"."
    })
    result=result.substr(0,result.length-1); // remove last trailing .
    return result;
  }
  

   
   hasChildren():boolean {
    return Object.keys(this._data.children).length > 0;
  }
  
  //
    getOrCreateField(field: PropertyInfo): MFormNode {
    
    
      var bus = this._data.bus;
    var _data = this._data;
    //if it is an index the node must be an array and the index must exist.
    //Creawte an index on demand may destroy the continuity of the indices
    if (field.isIndex()) 
    {
        if (this._data.isUndefined())
        {
          this._data.field.type = PropertyType.Array;
          this._data.array=[];
        }
        if (this._data.isArray())
        {
          if (this._data.array ==null)
            this._data.array = [];
          if (field.getIndex() == -1) //push element
          {
            var result = new MFormNode(this._data.bus,this);
            bus.push(this._data.array,result);
            return result;
          }
          else if (field.getIndex() < this._data.array.length)
          {
              return this._data.array[field.getIndex()];
          }
          else 
          {
            throw `Index ${field.getIndex()} out of range for array at ${this.getStringPath()}`
          }
        } 
        else
            throw `Node ${this.getStringPath()} is not an Array`
    }

    //Node must be an object to have a field
    //If it is not defined, define it then.
    if (!this.isDefined())  
    {
      this._data.field.type= PropertyType.Object
     
     
    }
      if (this._data.children[field.getFieldId()])
      {
        var child=this._data.children[field.getFieldId()]
        if (field.type && child._data.field.type != field.type)
          throw `Expect children ${child._data.field.getField()} to be ${child._data.field.type}, but it is ${field.type}`
        return this._data.children[field.getFieldId()];
      }
      else //create child
      {
        var child:MFormNode = new MFormNode(this._data.bus);
        child._data.field=field.clone();
        child._data.parent=this;
        bus.createProperty(this._data.children,field.getName(),child);
        return child;
      }
    
  }


  onModelChange(ev: IMFormChangeEvent) 
  {
    
    var path=ev.sourceNode.getStringPath().split(".");
    var cNode=this as MFormNode;
    for (var i=0;i<path.length;i++)
    {
        var isLast = i == path.length-1;
        var field = PropertyInfo.parse(path[i]);
        cNode=cNode.getOrCreateField(field);
    }
    if (ev.convertToArrayOfNodes)
    {
        var arr= ev.value as any[];
        var nodeArray =  arr.map(el=> {
          var result:MFormNode;
            if (InnerData.isNode(el))
            {
              result=el as MFormNode;
            }
            else 
            {
              result=MFormNode.createPrimitiveNode(this._data.bus,el,cNode);
            }
            result._data.parent=cNode;
            return result;
        })
        cNode._data.field.type=PropertyType.Array;
        cNode._data.array=nodeArray;
    }
    else {
        if (cNode._data.isUndefined() || cNode._data.isPrimitive())
        {
            cNode.setPrimitiveValue(ev.value); 
            cNode._data._error=ev.error;
        }  
    }
}
 
  public change(value:any):void
  {
    if (this._data.isUndefined() || this._data.isPrimitive())
    {
        this._data.bus.emit("change",{
            sourceNode: this,
            value:value,
            error:""
        } as IMFormChangeEvent)
    }
    else 
        throw `Cannot change value because ${this.getStringPath()} is not a primitive type`
  }
  
  public value():any {
      if (this._data.field.type!= PropertyType.Primitive)
      {
        throw `Can't get value at Node ${this.getStringPath()}, because it is not a final value, use the "member" method to go further in the object tree`; 
      }
      return this._data.primitiveValue;
  }
 
  public c_array() 
  {
      if (this._data.isUndefined() || this._data.isArray())
      {
        return   this._data.array==null ? [] : this._data.array;
      }
      else 
        throw `Error the node ${this.getStringPath()} is not an array` 
  }

  private static getType(value: any): PropertyType {
    if (value == null)
      throw "type of a null value is undefined"
    if (typeof value != "object")
      return PropertyType.Primitive;
    else 
    {
      return Array.isArray(value)  ? PropertyType.Array : PropertyType.Object;
    }
  }
  public setAsArray(a?:any)
  {
    //check if this node is undefined or is an Array already.
    if (this._data.isUndefined() || this._data.isArray())
    {
      
      this._data.bus.emit("change", {
        sourceNode:this,
        value:a ? a : [],
        error:"",
        convertToArrayOfNodes:true
      } as IMFormChangeEvent)
    }
    else {
        throw `Error the node ${this.getStringPath()} is not an array` 
    }

  }

 public setError(value:any,message:string)
 {
  this._data.bus.emit("change",{
    sourceNode: this,
    value:value,
    error:message
  } as IMFormChangeEvent)
 }
 public error():string {return this._data._error;}

  public member(fieldName:string):IRModel
  {
    if (this._data.field.type)
    {
      if (this._data.field.type !== PropertyType.Object)
      {
        throw "Cannot delegate a field of a non object node";
      }
    }
    
    var result = new MFormNode(this._data.bus);
    if (this.hasProperty(fieldName))
    {
      return this._data.children[fieldName];
    }
    else
    {
      return this.createUndefinedProperty(fieldName);
    }
  }

  public push():MFormNode
  {
    if (this._data.isUndefined() || this._data.isArray())
    {
        var result = new MFormNode(this._data.bus);
        result._data.parent=this;
        result._data.field = new PropertyInfo(-1)
        return result;
    }
    throw `Can't push a node to a non Array at ${this.getStringPath()}`
  }

  public buildObject() {
      
  }
  
  public static createPrimitiveNode(bus:IFramework,obj:any,parent:MFormNode)
  {
    var result = new MFormNode(bus,parent);
    result.setPrimitiveValue(obj);
    return result;
  }
  
  public static createMFormTree(bus:IFramework,obj:any):MFormNode
  {
    var objectsTraversed:any[]=[];
    var createNodeAux = (parent:MFormNode|null,field:string|number,obj:any)=>{


      var n = new MFormNode(bus)
      n._data.field.setField(field);


      n._data.parent=parent;
      if (parent!=null)
      {
        if (parent._data.field.type == PropertyType.Object)
          parent._data.children[field]=n;
        else {
          if (parent._data.array !=null)
          {
            parent._data.array.push(n);
          }
        }
      }
      if (obj!=null)
      {
        n._data.field.type = MFormNode.getType(obj)
        
        if (n._data.field.type == PropertyType.Object)
        {
          if (objectsTraversed.indexOf(obj)!=-1) throw 'object is recursive';

          objectsTraversed.push(obj);
          var keys=Object.keys(obj);
          for (var i=0;i<keys.length;i++){
            var k = keys[i];
            createNodeAux(n,k,obj[k])
          }
        }
        else if (n._data.field.type == PropertyType.Array)
        {
          if (objectsTraversed.indexOf(obj)!=-1) throw 'object is recursive';
          objectsTraversed.push(obj);
          var a = obj as any[];
          n._data.array=[];
          for (var i=0;i<a.length;i++)
          {
            createNodeAux(n,i,a[i]);
          }
        }
        else {
          n._data.primitiveValue=obj;
        }

      }
      return n;
    }
    return createNodeAux(null,'',obj);
  }  


  public static toPoco(obj:MFormNode):any
  {
    
    var toPocoAux= function(obj:MFormNode) {
      let result:any=null;
      if (obj._data.field.type == PropertyType.Object)
      {
        result={};
        var children = obj._data.children;
        var keys = Object.keys(children);
        keys.forEach(key=>{
          var node = children[key] as MFormNode;
          result[node._data.field.getName()]=toPocoAux(node);
        })
   
      }
      if (obj._data.field.type == PropertyType.Array)
      {
        result=[];
        var a = obj.c_array();
        a.forEach(x=>{
          var r = toPocoAux(x);
          result.push(r);
        })
      }
      if (obj._data.field.type == PropertyType.Primitive)
      {
        result=obj.value();
      }
      return result;

    };
    return toPocoAux(obj);
  }  
}




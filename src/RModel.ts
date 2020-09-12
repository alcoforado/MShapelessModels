


export enum PropertyType {
  Object = "object",
  Array = "array",
  Primitive = "primitive"
}


export class PropertyInfo {
   name:string;
  type:PropertyType;
   index:number;

  constructor(field:string|number,type:PropertyType)
  {
    this.type=type;
    this.setField(field);
  }

  clone():PropertyInfo{
    return new PropertyInfo(this.getFieldId(),this.type);
  }
  getFieldId():string|number
  {
    if (this.name!=null) return this.name;
    return this.index;
  }

  getField():string {
    if (this.name!=null)
      return this.name
   if (this.index!=null)
    return this.index.toString()
   else
    return ''
  }

  getIndex():number {
      if (this.index!=null)
        return this.index;
      else
        throw "field is not an index" 

  }

  static parse(pathPart:string):PropertyInfo
  {
    var intExp= /^[0-9]+$/g;
    if (pathPart.match(intExp) !=null)
    {
        var i:number = parseInt(pathPart);
        return new PropertyInfo(i,null);
    }
    else 
    {
        return new PropertyInfo(pathPart,null);
    }

  }

  getName():string {
    if (!this.isName())
        throw "Field is an index not a name"  ;
    
    return this.name;
  }

  isIndex():boolean {return this.index!=null};
  isName():boolean {return this.name!=null};
  setField(field:string|number)
    {
      if (typeof field == "number")
        {
          this.index=field;
          this.name=null;
        }
      else 
      {
        this.name=field;
        this.index=null;
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
    createProperty(dst:any,fieldName:string,propertyValue:any);
    emit(name:string,value:any);
}



export class RModelArray extends Array<IRModel> 
{


}

export interface IRModel {
  change(value:any):void
  setError(value:any,message:string):void
  value():any
  member(fieldName:string):IRModel
  error():string;
  c_array():Array<MFormNode>
  setAsArray(a:Array<MFormNode>)

}

class InnerData {
    field:PropertyInfo
    parent:MFormNode;
    _error:string=null;
    bus:IFramework;
    isMFormNode:boolean = true;
    children:{[key:string]:MFormNode}
    primitiveValue:any=null;
    array:Array<MFormNode>=null;
    
    static isNode(obj:any):boolean{
        return (obj && obj._data && obj._data.isMFormNode)
    }
    isUndefined():boolean {return this.field.type==null}
    isArray():boolean {return this.field.type == PropertyType.Array}
    isPrimitive():boolean {return this.field.type == PropertyType.Primitive}
    constructor(pMasterComponent:IFramework)
    {
        this.field=new PropertyInfo('',null);
        this.isMFormNode=true;
        this.parent=null;
        this.children={};
        this.bus=pMasterComponent;
      }


}

export class MFormNode implements IRModel{
  
    _data: InnerData;
  

    




  
    constructor (bus:IFramework)
    {
        this._data = new InnerData(bus);
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
    result._data.field = new PropertyInfo(field,null)
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
    while(!it.isRoot())
    {
      it=it._data.parent;
    }
    return it;
  }
   getPath():PropertyInfo[] 
  {
    var result:PropertyInfo[]= [];
    var it:MFormNode = this;
    while (it)
    {
      result.push(it._data.field.clone());
      it=it._data.parent;
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
    
    

    var _data = this._data;
    //if it is an index the node must be an array and the index must exist.
    //Creawte an index on demand may destroy the continuity of the indices
    if (field.isIndex()) 
    {
        if (this._data.isArray())
        {
            if (field.getIndex() < this._data.array.length)
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
        this._data.bus.createProperty(this._data.children,field.getName(),child);
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
            if (InnerData.isNode(el))
                return el;
            return MFormNode.createMFormTree(this._data.bus,el);
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
            error:null
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
      return null;
    if (typeof value != "object")
      return PropertyType.Primitive;
    else 
    {
      return Array.isArray(value)  ? PropertyType.Array : PropertyType.Object;
    }
  }
  public setAsArray(a:any[])
  {
    if (this._data.isUndefined || this._data.isArray)
    {
      this._data.bus.emit("change", {
        sourceNode:this,
        value:a,
        error:null,
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
    if (this._data.field.type != null)
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

  public buildObject() {
      
  }
  
  
  
  public static createMFormTree(bus:IFramework,obj:any):MFormNode
  {
    var objectsTraversed:any[]=[];
    var createNodeAux = (parent:MFormNode,field:string|number,obj:any)=>{


      var n = new MFormNode(bus)
      n._data.field.setField(field);


      n._data.parent=parent;
      if (parent!=null)
      {
        if (parent._data.field.type == PropertyType.Object)
          parent._data.children[field]=n;
        else 
          parent._data.array.push(n);
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
}


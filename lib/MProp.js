"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MFormNode = exports.PropertyInfo = exports.PropertyType = void 0;
var PropertyType;
(function (PropertyType) {
    PropertyType["Object"] = "object";
    PropertyType["Array"] = "array";
    PropertyType["Primitive"] = "primitive";
})(PropertyType = exports.PropertyType || (exports.PropertyType = {}));
var PropertyInfo = /** @class */ (function () {
    function PropertyInfo(field, type) {
        if (type)
            this.type = type;
        this.setField(field);
    }
    PropertyInfo.prototype.clone = function () {
        return new PropertyInfo(this.getFieldId(), this.type);
    };
    PropertyInfo.prototype.getFieldId = function () {
        if (this.name)
            return this.name;
        if (this.index)
            return this.index;
        throw "invalid field id";
    };
    PropertyInfo.prototype.getField = function () {
        if (this.name)
            return this.name;
        if (this.index)
            return this.index.toString();
        else
            return '';
    };
    PropertyInfo.prototype.getIndex = function () {
        if (this.index)
            return this.index;
        else
            throw "field is not an index";
    };
    PropertyInfo.parse = function (pathPart) {
        var intExp = /^-?[0-9]+$/g;
        if (pathPart.match(intExp) != null) {
            var i = parseInt(pathPart);
            return new PropertyInfo(i);
        }
        else {
            return new PropertyInfo(pathPart);
        }
    };
    PropertyInfo.prototype.getName = function () {
        if (this.name)
            return this.name;
        throw "Field is an index not a name";
    };
    PropertyInfo.prototype.isIndex = function () { return this.index ? true : false; };
    ;
    PropertyInfo.prototype.isName = function () { return this.name ? true : false; };
    ;
    PropertyInfo.prototype.setField = function (field) {
        if (typeof field == "number") {
            this.index = field;
        }
        else {
            this.name = field;
        }
    };
    return PropertyInfo;
}());
exports.PropertyInfo = PropertyInfo;
var InnerData = /** @class */ (function () {
    function InnerData(frm, parent) {
        this._error = "";
        this.isMFormNode = true;
        this.primitiveValue = null;
        this.array = null;
        this.field = new PropertyInfo('');
        this.isMFormNode = true;
        this.parent = parent ? parent : null;
        this.children = {};
        this.bus = frm;
    }
    InnerData.isNode = function (obj) {
        return (obj && obj._data && obj._data.isMFormNode);
    };
    InnerData.prototype.isUndefined = function () { return this.field.type == null; };
    InnerData.prototype.isArray = function () { return this.field.type == PropertyType.Array; };
    InnerData.prototype.isPrimitive = function () { return this.field.type == PropertyType.Primitive; };
    InnerData.prototype.getParent = function () {
        if (!this.parent)
            throw "Node has no parent";
        return this.parent;
    };
    return InnerData;
}());
var MFormNode = /** @class */ (function () {
    function MFormNode(bus, parent) {
        this._data = new InnerData(bus, parent);
    }
    MFormNode.prototype.isRoot = function () {
        return this._data.parent == null;
    };
    MFormNode.prototype.isDefined = function () {
        return this._data.field.type != null;
    };
    MFormNode.prototype.hasProperty = function (p) {
        return this.isDefined() && this._data.children[p] && this._data.children[p].isDefined();
    };
    MFormNode.prototype.createUndefinedProperty = function (field) {
        var result = new MFormNode(this._data.bus);
        result._data.field = new PropertyInfo(field);
        result._data.parent = this;
        result._data.children = {};
        return result;
    };
    //Define the node as primitive
    MFormNode.prototype.setPrimitiveValue = function (value) {
        if (this.hasChildren())
            throw "Can't set value at Node " + this.getStringPath() + ", node has children";
        if (this._data.field.type == null) {
            this._data.field.type = PropertyType.Primitive;
        }
        if (this._data.field.type == PropertyType.Primitive) {
            this._data.primitiveValue = value;
        }
        else
            throw "Error on set value for node " + this.getStringPath + ", type is not primitive, it actually is  " + this._data.field.type;
    };
    MFormNode.prototype.getRoot = function () {
        var it = this;
        while (it._data.parent != null) {
            it = it._data.parent;
        }
        return it;
    };
    MFormNode.prototype.getPath = function () {
        var result = [];
        var it = this;
        while (!it.isRoot()) {
            result.push(it._data.field.clone());
            it = it._data.getParent();
        }
        return result.reverse();
    };
    MFormNode.prototype.getStringPath = function () {
        var path = this.getPath();
        var result = "";
        path.forEach(function (p) {
            if (p.getField())
                result += p.getField() + ".";
        });
        result = result.substr(0, result.length - 1); // remove last trailing .
        return result;
    };
    MFormNode.prototype.hasChildren = function () {
        return Object.keys(this._data.children).length > 0;
    };
    //
    MFormNode.prototype.getOrCreateField = function (field) {
        var bus = this._data.bus;
        var _data = this._data;
        //if it is an index the node must be an array and the index must exist.
        //Creawte an index on demand may destroy the continuity of the indices
        if (field.isIndex()) {
            if (this._data.isUndefined()) {
                this._data.field.type = PropertyType.Array;
                this._data.array = [];
            }
            if (this._data.isArray()) {
                if (this._data.array == null)
                    this._data.array = [];
                if (field.getIndex() == -1) //push element
                 {
                    var result = new MFormNode(this._data.bus, this);
                    bus.push(this._data.array, result);
                    return result;
                }
                else if (field.getIndex() < this._data.array.length) {
                    return this._data.array[field.getIndex()];
                }
                else {
                    throw "Index " + field.getIndex() + " out of range for array at " + this.getStringPath();
                }
            }
            else
                throw "Node " + this.getStringPath() + " is not an Array";
        }
        //Node must be an object to have a field
        //If it is not defined, define it then.
        if (!this.isDefined()) {
            this._data.field.type = PropertyType.Object;
        }
        if (this._data.children[field.getFieldId()]) {
            var child = this._data.children[field.getFieldId()];
            if (field.type && child._data.field.type != field.type)
                throw "Expect children " + child._data.field.getField() + " to be " + child._data.field.type + ", but it is " + field.type;
            return this._data.children[field.getFieldId()];
        }
        else //create child
         {
            var child = new MFormNode(this._data.bus);
            child._data.field = field.clone();
            child._data.parent = this;
            bus.createProperty(this._data.children, field.getName(), child);
            return child;
        }
    };
    MFormNode.prototype.onModelChange = function (ev) {
        var _this = this;
        var path = ev.sourceNode.getStringPath().split(".");
        var cNode = this;
        for (var i = 0; i < path.length; i++) {
            var isLast = i == path.length - 1;
            var field = PropertyInfo.parse(path[i]);
            cNode = cNode.getOrCreateField(field);
        }
        if (ev.convertToArrayOfNodes) {
            var arr = ev.value;
            var nodeArray = arr.map(function (el) {
                var result;
                if (InnerData.isNode(el)) {
                    result = el;
                }
                else {
                    result = MFormNode.createPrimitiveNode(_this._data.bus, el, cNode);
                }
                result._data.parent = cNode;
                return result;
            });
            cNode._data.field.type = PropertyType.Array;
            cNode._data.array = nodeArray;
        }
        else {
            if (cNode._data.isUndefined() || cNode._data.isPrimitive()) {
                cNode.setPrimitiveValue(ev.value);
                cNode._data._error = ev.error;
            }
        }
    };
    MFormNode.prototype.change = function (value) {
        if (this._data.isUndefined() || this._data.isPrimitive()) {
            this._data.bus.emit("change", {
                sourceNode: this,
                value: value,
                error: ""
            });
        }
        else
            throw "Cannot change value because " + this.getStringPath() + " is not a primitive type";
    };
    MFormNode.prototype.value = function () {
        if (this._data.field.type != PropertyType.Primitive) {
            throw "Can't get value at Node " + this.getStringPath() + ", because it is not a final value, use the \"member\" method to go further in the object tree";
        }
        return this._data.primitiveValue;
    };
    MFormNode.prototype.c_array = function () {
        if (this._data.isUndefined() || this._data.isArray()) {
            return this._data.array == null ? [] : this._data.array;
        }
        else
            throw "Error the node " + this.getStringPath() + " is not an array";
    };
    MFormNode.getType = function (value) {
        if (value == null)
            throw "type of a null value is undefined";
        if (typeof value != "object")
            return PropertyType.Primitive;
        else {
            return Array.isArray(value) ? PropertyType.Array : PropertyType.Object;
        }
    };
    MFormNode.prototype.setAsArray = function (a) {
        //check if this node is undefined or is an Array already.
        if (this._data.isUndefined() || this._data.isArray()) {
            this._data.bus.emit("change", {
                sourceNode: this,
                value: a ? a : [],
                error: "",
                convertToArrayOfNodes: true
            });
        }
        else {
            throw "Error the node " + this.getStringPath() + " is not an array";
        }
    };
    MFormNode.prototype.setError = function (value, message) {
        this._data.bus.emit("change", {
            sourceNode: this,
            value: value,
            error: message
        });
    };
    MFormNode.prototype.error = function () { return this._data._error; };
    MFormNode.prototype.member = function (fieldName) {
        if (this._data.field.type) {
            if (this._data.field.type !== PropertyType.Object) {
                throw "Cannot delegate a field of a non object node";
            }
        }
        var result = new MFormNode(this._data.bus);
        if (this.hasProperty(fieldName)) {
            return this._data.children[fieldName];
        }
        else {
            return this.createUndefinedProperty(fieldName);
        }
    };
    MFormNode.prototype.push = function () {
        if (this._data.isUndefined() || this._data.isArray()) {
            var result = new MFormNode(this._data.bus);
            result._data.parent = this;
            result._data.field = new PropertyInfo(-1);
            return result;
        }
        throw "Can't push a node to a non Array at " + this.getStringPath();
    };
    MFormNode.prototype.buildObject = function () {
    };
    MFormNode.createPrimitiveNode = function (bus, obj, parent) {
        var result = new MFormNode(bus, parent);
        result.setPrimitiveValue(obj);
        return result;
    };
    MFormNode.createMFormTree = function (bus, obj) {
        var objectsTraversed = [];
        var createNodeAux = function (parent, field, obj) {
            var n = new MFormNode(bus);
            n._data.field.setField(field);
            n._data.parent = parent;
            if (parent != null) {
                if (parent._data.field.type == PropertyType.Object)
                    parent._data.children[field] = n;
                else {
                    if (parent._data.array != null) {
                        parent._data.array.push(n);
                    }
                }
            }
            if (obj != null) {
                n._data.field.type = MFormNode.getType(obj);
                if (n._data.field.type == PropertyType.Object) {
                    if (objectsTraversed.indexOf(obj) != -1)
                        throw 'object is recursive';
                    objectsTraversed.push(obj);
                    var keys = Object.keys(obj);
                    for (var i = 0; i < keys.length; i++) {
                        var k = keys[i];
                        createNodeAux(n, k, obj[k]);
                    }
                }
                else if (n._data.field.type == PropertyType.Array) {
                    if (objectsTraversed.indexOf(obj) != -1)
                        throw 'object is recursive';
                    objectsTraversed.push(obj);
                    var a = obj;
                    n._data.array = [];
                    for (var i = 0; i < a.length; i++) {
                        createNodeAux(n, i, a[i]);
                    }
                }
                else {
                    n._data.primitiveValue = obj;
                }
            }
            return n;
        };
        return createNodeAux(null, '', obj);
    };
    MFormNode.toPoco = function (obj) {
        var toPocoAux = function (obj) {
            var result = null;
            if (obj._data.field.type == PropertyType.Object) {
                result = {};
                var children = obj._data.children;
                var keys = Object.keys(children);
                keys.forEach(function (key) {
                    var node = children[key];
                    result[node._data.field.getName()] = toPocoAux(node);
                });
            }
            if (obj._data.field.type == PropertyType.Array) {
                result = [];
                var a = obj.c_array();
                a.forEach(function (x) {
                    var r = toPocoAux(x);
                    result.push(r);
                });
            }
            if (obj._data.field.type == PropertyType.Primitive) {
                result = obj.value();
            }
            return result;
        };
        return toPocoAux(obj);
    };
    return MFormNode;
}());
exports.MFormNode = MFormNode;

import { assert, expect } from 'chai';
import * as chai from 'chai';
import { MFormNode, IFramework } from '../src/MProp'
import 'mocha'

var should = chai.should();

class PlainObjects implements IFramework {
    push(array: MFormNode[], result: MFormNode) {
        array.push(result);
    }

    constructor(public rootObject: MFormNode|null) {

    }
    createProperty(dst: any, fieldName: string, propertyValue: any) {
        dst[fieldName] = propertyValue;
    }
    emit(name: string, value: any) {
        if (this.rootObject == null)
            throw "root object is null"
        this.rootObject.onModelChange(value)
    }


}

describe('Create MForm from Object', function () {
    var frm = new PlainObjects(null);
    describe('Plain Object', function () {
        var obj = {
            f1: "blah",
            f2: "blo",
            f3: 5,
            f4: true
        }
        var mform = MFormNode.createMFormTree(frm, obj);
        it('Testing Mform fields', function () {
            assert(mform.member("f1").value() == "blah");
            assert(mform.member("f2").value() == "blo");
            assert(mform.member("f3").value() == 5);
            assert(mform.member("f4").value() == true);
        })

    })

    describe('Composed Object', function () {
        var obj = {
            f1: { x: "blah", y: 5 },
            f2: { z: "blo", t: 3 },
            f3: true
        }
        var mform = MFormNode.createMFormTree(frm, obj);
        it('Testing Mform fields', function () {
            assert(mform.member("f1").member("x").value() == "blah");
            assert(mform.member("f1").member("y").value() == 5);
            assert(mform.member("f2").member("z").value() == "blo");
            assert(mform.member("f2").member("t").value() == 3);
            assert(mform.member("f3").value() == true);
        })

    })

    describe('Composed Object With Array', function () {
        var obj = {
            f1: { x: "blah", y: 5 },
            f2: [{ z: "blo", t: 3 }, { z: "cla", t: 8 }],
            f3: []
        }
        var mform = MFormNode.createMFormTree(frm, obj);
        it('Testing Mform fields', function () {
            assert(mform.member("f1").member("x").value() == "blah");
            assert(mform.member("f1").member("y").value() == 5);
            assert(mform.member("f2").c_array()[0].member("z").value() == "blo");
            assert(mform.member("f2").c_array()[0].member("t").value() == 3);
            assert(mform.member("f2").c_array()[1].member("z").value() == "cla");
            assert(mform.member("f2").c_array()[1].member("t").value() == 8);
            assert(mform.member("f3").c_array().length == 0);
        })
    })



})

describe('Create Declarative MForms', function () {

    it('Creating primitive fields', function () {
        let frm = new PlainObjects(null);
        let obj = new MFormNode(frm);
        frm.rootObject = obj;
        obj.member("x").change(5);
        obj.member("y").change(6);
        expect(obj.member("x").value()).to.equal(5);
        expect(obj.member("y").value()).to.equal(6);
    })

    it('Creating Composed Object', function () {
        let frm = new PlainObjects(null);
        let obj = new MFormNode(frm);
        frm.rootObject = obj;
        obj.member("P1").member("x").change(5);
        obj.member("P1").member("y").change(6);
        expect(obj.member("P1").member("x").value()).to.equal(5);
        expect(obj.member("P1").member('y').value()).to.equal(6);
    })

    it('Creating Array Member in Object using setAsArray', function () {
        let frm = new PlainObjects(null);
        let obj = new MFormNode(frm);
        frm.rootObject = obj;
        obj.member("A1").setAsArray(["h1", "h2"]);
        expect(obj.member("A1").c_array()[0].value()).to.equal("h1");
        expect(obj.member("A1").c_array()[1].value()).to.equal("h2");
    })

    it('Creating Array Member in Object using push', function () {
        let frm = new PlainObjects(null);
        let obj = new MFormNode(frm);
        frm.rootObject = obj;
        obj.member("A1").push().change("h1");
        obj.member("A1").push().change("h2");
        expect(obj.member("A1").c_array()[0].value()).to.equal("h1");
        expect(obj.member("A1").c_array()[1].value()).to.equal("h2");
    })

    it('Creating Array of Nodes using push', function () {
        let frm = new PlainObjects(null);
        let obj = new MFormNode(frm);
        frm.rootObject = obj;
        obj.member("A1").push().member("C1").change("h1");
        obj.member("A1").push().member("C2").change("h2");
        expect(obj.member("A1").c_array()[0].member("C1").value()).to.equal("h1");
        expect(obj.member("A1").c_array()[1].member("C2").value()).to.equal("h2");
    })

})


describe('Convert MFormNode to Poco', function () {




    let frm = new PlainObjects(null);
    let obj = new MFormNode(frm);
    frm.rootObject = obj;

    it('Flat Object', function () {
        obj.member("x").change(5);
        obj.member("y").change(6);
        var r = MFormNode.toPoco(obj);
        expect(r.x).to.equal(5);
        expect(r.y).to.equal(6);
    })

    it('Chain Object', function () {
        obj.member("D").member("l").change(7);
        obj.member("D").member("g").change(8);

        var r = MFormNode.toPoco(obj);
        expect(r.D.l).to.equal(7);
        expect(r.D.g).to.equal(8);
    })


    it('Plain Array', function () {
        obj.member("A1").push().change("h1");
        obj.member("A1").push().change("h2");
        var r = MFormNode.toPoco(obj);
        expect(r.A1[0]).to.equal("h1");
        expect(r.A1[1]).to.equal("h2");
    })

    it('Array of Objects', function () {
        obj.member("B1").push().member("C1").change("h1");
        obj.member("B1").push().member("C2").change("h2");
        var r = MFormNode.toPoco(obj);
        expect(r.B1[0].C1).to.equal('h1');
        expect(r.B1[1].C2).to.equal('h2');
    })










})
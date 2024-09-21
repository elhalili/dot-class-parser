const { readFileSync } = require('fs');
const { ConstantInfo_Reader } = require('./constants');
const { extractFlags } = require('./flags');
const { callbackify } = require('util');
/*
 ClassFile {
     u4             magic;
     u2             minor_version;
     u2             major_version;
     u2             constant_pool_count;
     cp_info        constant_pool[constant_pool_count-1];
     u2             access_flags;
     u2             this_class;
     u2             super_class;
     u2             interfaces_count;
     u2             interfaces[interfaces_count];
     u2             fields_count;
     field_info     fields[fields_count];
     u2             methods_count;
     method_info    methods[methods_count];
     u2             attributes_count;
     attribute_info attributes[attributes_count];
 }
*/

class Parser {
  constructor(filePath) {
    this.fileBuffer = readFileSync('./Hello.class');
    this.offset = 0;
  }
  readU1() {
    const u1 = this.fileBuffer.readUInt8(this.offset);
    this.offset++;

    return u1;
  }
  readU2() {
    const u2 = this.fileBuffer.readUInt16BE(this.offset);
    this.offset += 2;

    return u2;
  }
  readU4() {
    const u4 = this.fileBuffer.readUInt32BE(this.offset);
    this.offset += 4;

    return u4;
  }
}

const parser = new Parser('./Hello.class');

const classStructure = {};
// Just the usual magic number
classStructure.magic = parser.readU4().toString(16);

// Minor and major => class file version. ex: major = M, minor = n => version = M.n
classStructure.minor = parser.readU2();
classStructure.major = parser.readU2();
classStructure.version = classStructure.major + '.' + classStructure.minor;

// constant_pool_count =  len(constant_pool) + 1 (there is an execption for type long, double)
classStructure.constant_pool_count = parser.readU2();

/*
  cp_info constant_pool[constant_pool_count-1];
  cp_info {
      u1 tag;
      u1 info[];
  }
*/
classStructure.constant_pool = [];

const cp_reader = new ConstantInfo_Reader(parser);
for (let i = 0; i < classStructure.constant_pool_count - 1; i++) {
  const tag = parser.readU1();
  classStructure.constant_pool.push(cp_reader.getTagInfo(tag));
}

// u2 access_flags;
const access_flags = parser.readU2();
classStructure.access_flags = {};
classStructure.access_flags.flags_u2 = access_flags;
classStructure.access_flags.flags_str = extractFlags(access_flags);

// u2 this_class;
classStructure.this_class = parser.readU2();
// u2 super_class;
classStructure.super_class = parser.readU2();

// u2 interfaces_count: number of direct superinterfaces of this class or interface type
classStructure.interfaces_count = parser.readU2();

/**
 * u2 interfaces[]
 * Each value in the interfaces array must be a valid index into the constant_pool table. The constant_pool entry at each value of interfaces[i], where 0 ≤ i < interfaces_count, must be a CONSTANT_Class_info structure representing an interface that is a direct superinterface of this class or interface type, in the left-to-right order given in the source for the type.
 */
classStructure.interfaces = [];
for (let i = 0; i < classStructure.interfaces_count; i++) {
  const interface = {};
  interface.index = parser.readU2();
  interface.name =
    classStructure.constant_pool[
      classStructure.constant_pool[interface.index - 1].name_index - 1
    ].bytes_str;

  classStructure.interfaces.push(interface);
}

// u2 fields_count
classStructure.fields_count = parser.readU2();
// field_info fields[fields_count];
classStructure.fields = [];

/*
  field_info {
      u2             access_flags;
      u2             name_index;
      u2             descriptor_index;
      u2             attributes_count;
      attribute_info attributes[attributes_count];
  }
*/
for (let i = 0; i < classStructure.fields_count; i++) {
  const field_info = {};
  field_info.access_flags = {
    flag_u2: parser.readU2(),
  };

  field_info.name_index = parser.readU2();
  field_info.descriptor_index = parser.readU2();
  field_info.attributes_count = parser.readU2();
  field_info.attributes = [];

  /*
    attribute_info {
      u2 attribute_name_index;
      u4 attribute_length;
      u1 info[attribute_length];
    }
  */
  for (let j = 0; j < field_info.attributes_count; j++) {
    const attribute_info = {};
    attribute_info.attribute_name_index = parser.readU2();
    attribute_info.attribute_length = parser.readU4();
    attribute_info.info = [];

    for (let k = 0; k < attribute_info.attribute_length; k++) {
      attribute_info.info.push(parser.readU1());
    }

    field_info.attributes.push(attribute_info);
  }

  classStructure.fields.push(field_info);
}

// u2 methods_count;
classStructure.methods_count = parser.readU2();
// method_info methods[methods_count];
classStructure.methods = [];

/*
  method_info {
    u2             access_flags;
    u2             name_index;
    u2             descriptor_index;
    u2             attributes_count;
    attribute_info attributes[attributes_count];
  }
*/
for (let q = 0; q < classStructure.methods_count; q++) {
  const method_info = {};
  method_info.access_flags = parser.readU2();
  method_info.name_index = parser.readU2();
  method_info.descriptor_index = parser.readU2();
  method_info.attributes_count = parser.readU2();
  method_info.attributes = [];

  /*
    attribute_info {
      u2 attribute_name_index;
      u4 attribute_length;
      u1 info[attribute_length];
    }
  */
  for (let j = 0; j < method_info.attributes_count; j++) {
    const attribute_info = {};
    attribute_info.attribute_name_index = parser.readU2();
    attribute_info.attribute_length = parser.readU4();
    attribute_info.info = [];

    for (let k = 0; k < attribute_info.attribute_length; k++) {
      attribute_info.info.push(parser.readU1());
    }

    if (
      classStructure.constant_pool[attribute_info.attribute_name_index - 1]
        .bytes_str === 'Code'
    ) {
      const code = {};
      const buf = Buffer.from(attribute_info.info);
      let i = 0;
      code.max_stack = buf.readUInt16BE(i);
      i += 2;
      code.max_locals = buf.readUInt16BE(i);
      i += 2;
      code.code_length = buf.readUint32BE(i);
      i += 4;
      //  here you will find the jvm byte code: to know mnemonics go to the JVM Instruction Set specification
      code.code = [];

      for (let l = 0; l < code.code_length; l++) {
        code.code.push(buf.readUInt8(i++));
      }
      code.code_str = code.code.map((e) => '0x' + e.toString(16));
      code.exception_table_length = buf.readUInt16BE(i);
      i += 2;
      code.exception_table = [];
      for (let l = 0; l < code.exception_table_length; l++) {
        const excep = {};
        excep.start_pc = buf.readUInt16BE(i);
        i += 2;
        excep.end_pc = buf.readUInt16BE(i);
        i += 2;
        excep.handler_pc = buf.readUInt16BE(i);
        i += 2;
        excep.catch_type = buf.readUInt16BE(i);
        i += 2;

        code.exception_table.push(excep);
      }
      code.attributes_count = buf.readUInt16BE(i);
      i += 2;
      code.attribute_info = [];
      for (let l = 0; l < code.attributes_count; l++) {
        const attribute_info = {};
        attribute_info.attribute_name_index = buf.readUInt16BE(i);
        i += 2;
        attribute_info.attribute_length = buf.readUInt32BE(i);
        i += 4;
        attribute_info.info = [];

        for (let n = 0; n < attribute_info.attribute_length; n++) {
          attribute_info.info.push(buf.readUInt8(i++));
        }

        code.attribute_info.push(attribute_info);
      }

      console.log(code);
    }
    method_info.attributes.push(attribute_info);
  }

  classStructure.methods.push(method_info);
}

// u2 attributes_count
classStructure.attributes_count = parser.readU2();
// attribute_info attributes[attributes_count]
classStructure.attributes = [];
for (let i = 0; i < classStructure.attributes_count; i++) {
  const attribute_info = {};
  attribute_info.attribute_name_index = parser.readU2();
  attribute_info.attribute_length = parser.readU4();
  attribute_info.info = [];

  for (let j = 0; j < attribute_info.attribute_length; j++) {
    attribute_info.info.push(parser.readU1());
  }

  classStructure.attributes.push(attribute_info);
}

console.log(classStructure);

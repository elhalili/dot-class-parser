const assert = require('assert');

const CONSTANT_TAGS = Object.seal({
  CONSTANT_Class: 7,
  CONSTANT_Fieldref: 9,
  CONSTANT_Methodref: 10,
  CONSTANT_InterfaceMethodref: 11,
  CONSTANT_String: 8,
  CONSTANT_Integer: 3,
  CONSTANT_Float: 4,
  CONSTANT_Long: 5,
  CONSTANT_Double: 6,
  CONSTANT_NameAndType: 12,
  CONSTANT_Utf8: 1,
  CONSTANT_MethodHandle: 15,
  CONSTANT_MethodType: 16,
  CONSTANT_InvokeDynamic: 18,
});

class ConstantInfo_Reader {
  constructor(parser) {
    this.parser = parser;
  }

  getTagInfo(tag) {
    switch (tag) {
      case CONSTANT_TAGS.CONSTANT_Class:
        return this.getClassInfo();

      case CONSTANT_TAGS.CONSTANT_Methodref:
        return this.getXRefInfo(tag);
      case CONSTANT_TAGS.CONSTANT_Fieldref:
        return this.getXRefInfo(tag);
      case CONSTANT_TAGS.CONSTANT_InterfaceMethodref:
        return this.getXRefInfo(tag);

      case CONSTANT_TAGS.CONSTANT_String:
        return this.getStringInfo();

      case CONSTANT_TAGS.CONSTANT_Float:
        return this.getIntFloatInfo(tag);
      case CONSTANT_TAGS.CONSTANT_Integer:
        return this.getIntFloatInfo(tag);

      case CONSTANT_TAGS.CONSTANT_Long:
        return this.getLongDoubleInfo(tag);
      case CONSTANT_TAGS.CONSTANT_Double:
        return this.getLongDoubleInfo(tag);

      case CONSTANT_TAGS.CONSTANT_NameAndType:
        return this.getNameTypeInfo();

      case CONSTANT_TAGS.CONSTANT_Utf8:
        return this.getUtf8Info();

      case CONSTANT_TAGS.CONSTANT_MethodHandle:
        return this.getMethodHandleInfo();

      case CONSTANT_TAGS.getMethodTypeInfo:
        return this.getMethodTypeInfo();

      case CONSTANT_TAGS.CONSTANT_InvokeDynamic:
        return this.getInvokeDynamicInfo();
      default:
        assert(false, `Not implemented TAG ${tag}`);
    }
  }

  getClassInfo() {
    /*
      CONSTANT_Class_info {
        u1 tag;
        u2 name_index;
      }
    */
    const name_index = this.parser.readU2();
    return {
      tag: CONSTANT_TAGS.CONSTANT_Class,
      name_index,
    };
  }
  getXRefInfo(tag) {
    /*
      CONSTANT_Fieldref_info {
          u1 tag;
          u2 class_index;
          u2 name_and_type_index;
      }

      CONSTANT_Methodref_info {
          u1 tag;
          u2 class_index;
          u2 name_and_type_index;
      }

      CONSTANT_InterfaceMethodref_info {
          u1 tag;
          u2 class_index;
          u2 name_and_type_index;
      }
    */
    const name_index = this.parser.readU2();
    const name_and_type_index = this.parser.readU2();

    return {
      tag,
      name_index,
      name_and_type_index,
    };
  }

  getStringInfo() {
    /*
    CONSTANT_String_info {
        u1 tag;
        u2 string_index;
    }
    */
    const string_index = this.parser.readU2();
    return {
      tag: CONSTANT_TAGS.CONSTANT_String,
      string_index,
    };
  }

  getIntFloatInfo(tag) {
    /*
      CONSTANT_Integer_info {
          u1 tag;
          u4 bytes;
      }

      CONSTANT_Float_info {
          u1 tag;
          u4 bytes;
      }
    */

    const bytes = this.parser.readU4();
    return {
      tag,
      bytes,
    };
  }

  getLongDoubleInfo(tag) {
    /*
      CONSTANT_Long_info {
          u1 tag;
          u4 high_bytes;
          u4 low_bytes;
      }

      CONSTANT_Double_info {
          u1 tag;
          u4 high_bytes;
          u4 low_bytes;
      }
    */
    const high_bytes = this.parser.readU4();
    const low_bytes = this.parser.readU4();

    return {
      tag,
      high_bytes,
      low_bytes,
    };
  }

  getNameTypeInfo() {
    /*
      CONSTANT_NameAndType_info {
          u1 tag;
          u2 name_index;
          u2 descriptor_index;
      }
    */

    const name_index = this.parser.readU2();
    const descriptor_index = this.parser.readU2();

    return {
      tag: CONSTANT_TAGS.CONSTANT_NameAndType,
      name_index,
      descriptor_index,
    };
  }

  getUtf8Info() {
    /*
      CONSTANT_Utf8_info {
          u1 tag;
          u2 length;
          u1 bytes[length];
      }
    */
    const length = this.parser.readU2();
    const bytes = [];
    for (let i = 0; i < length; i++) {
      bytes.push(this.parser.readU1());
    }

    return {
      tag: CONSTANT_TAGS.CONSTANT_Utf8,
      length,
      bytes,
      bytes_str: bytes.map((e) => String.fromCharCode(e)).join(''),
    };
  }

  getMethodHandleInfo() {
    /*
      CONSTANT_MethodHandle_info {
          u1 tag;
          u1 reference_kind;
          u2 reference_index;
      }      
    */

    const reference_kind = this.parser.readU1();
    const reference_index = this.parser.readU2();

    return {
      tag: CONSTANT_TAGS.CONSTANT_MethodHandle,
      reference_kind,
      reference_index,
    };
  }

  getMethodTypeInfo() {
    /*
      CONSTANT_MethodType_info {
          u1 tag;
          u2 descriptor_index;
      }
    */
    const descriptor_index = this.parser.readU2();

    return {
      tag: CONSTANT_TAGS.getMethodTypeInfo,
      descriptor_index,
    };
  }

  getInvokeDynamicInfo() {
    /*
      CONSTANT_InvokeDynamic_info {
          u1 tag;
          u2 bootstrap_method_attr_index;
          u2 name_and_type_index;
      }
    */
    const bootstrap_method_attr_index = this.parser.readU2();
    const name_and_type_index = this.parser.readU2();

    return {
      tag: CONSTANT_TAGS.CONSTANT_InvokeDynamic,
      bootstrap_method_attr_index,
      name_and_type_index,
    };
  }
}

module.exports = {
  ConstantInfo_Reader,
};

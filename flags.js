const CLASS_ACC_FLAGS = Object.seal({
  ACC_PUBLIC: {
    value: 0x0001,
    str: 'public',
  },
  ACC_FINAL: {
    value: 0x0010,
    str: 'final',
  },
  ACC_SUPER: {
    value: 0x0020,
    str: 'superclass',
  },
  ACC_INTERFACE: {
    value: 0x0200,
    str: 'interface',
  },
  ACC_ABSTRACT: {
    value: 0x0400,
    str: 'abstract',
  },
  ACC_SYNTHETIC: {
    value: 0x1000,
    str: 'synthetic',
  },
  ACC_ANNOTATION: {
    value: 0x2000,
    str: 'annotation',
  },
  ACC_ENUM: {
    value: 0x4000,
    str: 'enum',
  },
});

module.exports.extractFlags = (flags) => {
  const str_flags = [];
  for (const item in CLASS_ACC_FLAGS) {
    if ((flags & CLASS_ACC_FLAGS[item].value) === CLASS_ACC_FLAGS[item].value) {
      str_flags.push(CLASS_ACC_FLAGS[item].str);
    }
  }

  return str_flags;
};

"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/adm-zip/util/constants.js
var require_constants = __commonJS({
  "node_modules/adm-zip/util/constants.js"(exports2, module2) {
    module2.exports = {
      /* The local file header */
      LOCHDR: 30,
      // LOC header size
      LOCSIG: 67324752,
      // "PK\003\004"
      LOCVER: 4,
      // version needed to extract
      LOCFLG: 6,
      // general purpose bit flag
      LOCHOW: 8,
      // compression method
      LOCTIM: 10,
      // modification time (2 bytes time, 2 bytes date)
      LOCCRC: 14,
      // uncompressed file crc-32 value
      LOCSIZ: 18,
      // compressed size
      LOCLEN: 22,
      // uncompressed size
      LOCNAM: 26,
      // filename length
      LOCEXT: 28,
      // extra field length
      /* The Data descriptor */
      EXTSIG: 134695760,
      // "PK\007\008"
      EXTHDR: 16,
      // EXT header size
      EXTCRC: 4,
      // uncompressed file crc-32 value
      EXTSIZ: 8,
      // compressed size
      EXTLEN: 12,
      // uncompressed size
      /* The central directory file header */
      CENHDR: 46,
      // CEN header size
      CENSIG: 33639248,
      // "PK\001\002"
      CENVEM: 4,
      // version made by
      CENVER: 6,
      // version needed to extract
      CENFLG: 8,
      // encrypt, decrypt flags
      CENHOW: 10,
      // compression method
      CENTIM: 12,
      // modification time (2 bytes time, 2 bytes date)
      CENCRC: 16,
      // uncompressed file crc-32 value
      CENSIZ: 20,
      // compressed size
      CENLEN: 24,
      // uncompressed size
      CENNAM: 28,
      // filename length
      CENEXT: 30,
      // extra field length
      CENCOM: 32,
      // file comment length
      CENDSK: 34,
      // volume number start
      CENATT: 36,
      // internal file attributes
      CENATX: 38,
      // external file attributes (host system dependent)
      CENOFF: 42,
      // LOC header offset
      /* The entries in the end of central directory */
      ENDHDR: 22,
      // END header size
      ENDSIG: 101010256,
      // "PK\005\006"
      ENDSUB: 8,
      // number of entries on this disk
      ENDTOT: 10,
      // total number of entries
      ENDSIZ: 12,
      // central directory size in bytes
      ENDOFF: 16,
      // offset of first CEN header
      ENDCOM: 20,
      // zip file comment length
      END64HDR: 20,
      // zip64 END header size
      END64SIG: 117853008,
      // zip64 Locator signature, "PK\006\007"
      END64START: 4,
      // number of the disk with the start of the zip64
      END64OFF: 8,
      // relative offset of the zip64 end of central directory
      END64NUMDISKS: 16,
      // total number of disks
      ZIP64SIG: 101075792,
      // zip64 signature, "PK\006\006"
      ZIP64HDR: 56,
      // zip64 record minimum size
      ZIP64LEAD: 12,
      // leading bytes at the start of the record, not counted by the value stored in ZIP64SIZE
      ZIP64SIZE: 4,
      // zip64 size of the central directory record
      ZIP64VEM: 12,
      // zip64 version made by
      ZIP64VER: 14,
      // zip64 version needed to extract
      ZIP64DSK: 16,
      // zip64 number of this disk
      ZIP64DSKDIR: 20,
      // number of the disk with the start of the record directory
      ZIP64SUB: 24,
      // number of entries on this disk
      ZIP64TOT: 32,
      // total number of entries
      ZIP64SIZB: 40,
      // zip64 central directory size in bytes
      ZIP64OFF: 48,
      // offset of start of central directory with respect to the starting disk number
      ZIP64EXTRA: 56,
      // extensible data sector
      /* Compression methods */
      STORED: 0,
      // no compression
      SHRUNK: 1,
      // shrunk
      REDUCED1: 2,
      // reduced with compression factor 1
      REDUCED2: 3,
      // reduced with compression factor 2
      REDUCED3: 4,
      // reduced with compression factor 3
      REDUCED4: 5,
      // reduced with compression factor 4
      IMPLODED: 6,
      // imploded
      // 7 reserved for Tokenizing compression algorithm
      DEFLATED: 8,
      // deflated
      ENHANCED_DEFLATED: 9,
      // enhanced deflated
      PKWARE: 10,
      // PKWare DCL imploded
      // 11 reserved by PKWARE
      BZIP2: 12,
      //  compressed using BZIP2
      // 13 reserved by PKWARE
      LZMA: 14,
      // LZMA
      // 15-17 reserved by PKWARE
      IBM_TERSE: 18,
      // compressed using IBM TERSE
      IBM_LZ77: 19,
      // IBM LZ77 z
      AES_ENCRYPT: 99,
      // WinZIP AES encryption method
      /* General purpose bit flag */
      // values can obtained with expression 2**bitnr
      FLG_ENC: 1,
      // Bit 0: encrypted file
      FLG_COMP1: 2,
      // Bit 1, compression option
      FLG_COMP2: 4,
      // Bit 2, compression option
      FLG_DESC: 8,
      // Bit 3, data descriptor
      FLG_ENH: 16,
      // Bit 4, enhanced deflating
      FLG_PATCH: 32,
      // Bit 5, indicates that the file is compressed patched data.
      FLG_STR: 64,
      // Bit 6, strong encryption (patented)
      // Bits 7-10: Currently unused.
      FLG_EFS: 2048,
      // Bit 11: Language encoding flag (EFS)
      // Bit 12: Reserved by PKWARE for enhanced compression.
      // Bit 13: encrypted the Central Directory (patented).
      // Bits 14-15: Reserved by PKWARE.
      FLG_MSK: 4096,
      // mask header values
      /* Load type */
      FILE: 2,
      BUFFER: 1,
      NONE: 0,
      /* 4.5 Extensible data fields */
      EF_ID: 0,
      EF_SIZE: 2,
      /* Header IDs */
      ID_ZIP64: 1,
      ID_AVINFO: 7,
      ID_PFS: 8,
      ID_OS2: 9,
      ID_NTFS: 10,
      ID_OPENVMS: 12,
      ID_UNIX: 13,
      ID_FORK: 14,
      ID_PATCH: 15,
      ID_X509_PKCS7: 20,
      ID_X509_CERTID_F: 21,
      ID_X509_CERTID_C: 22,
      ID_STRONGENC: 23,
      ID_RECORD_MGT: 24,
      ID_X509_PKCS7_RL: 25,
      ID_IBM1: 101,
      ID_IBM2: 102,
      ID_POSZIP: 18064,
      EF_ZIP64_OR_32: 4294967295,
      EF_ZIP64_OR_16: 65535,
      EF_ZIP64_SUNCOMP: 0,
      EF_ZIP64_SCOMP: 8,
      EF_ZIP64_RHO: 16,
      EF_ZIP64_DSN: 24
    };
  }
});

// node_modules/adm-zip/util/errors.js
var require_errors = __commonJS({
  "node_modules/adm-zip/util/errors.js"(exports2) {
    var errors = {
      /* Header error messages */
      INVALID_LOC: "Invalid LOC header (bad signature)",
      INVALID_CEN: "Invalid CEN header (bad signature)",
      INVALID_END: "Invalid END header (bad signature)",
      /* Descriptor */
      DESCRIPTOR_NOT_EXIST: "No descriptor present",
      DESCRIPTOR_UNKNOWN: "Unknown descriptor format",
      DESCRIPTOR_FAULTY: "Descriptor data is malformed",
      /* ZipEntry error messages*/
      NO_DATA: "Nothing to decompress",
      BAD_CRC: "CRC32 checksum failed {0}",
      MAX_OUTPUT_EXCEEDED: "Decompressed data exceeds the declared uncompressed size",
      FILE_IN_THE_WAY: "There is a file in the way: {0}",
      UNKNOWN_METHOD: "Invalid/unsupported compression method",
      /* Inflater error messages */
      AVAIL_DATA: "inflate::Available inflate data did not terminate",
      INVALID_DISTANCE: "inflate::Invalid literal/length or distance code in fixed or dynamic block",
      TO_MANY_CODES: "inflate::Dynamic block code description: too many length or distance codes",
      INVALID_REPEAT_LEN: "inflate::Dynamic block code description: repeat more than specified lengths",
      INVALID_REPEAT_FIRST: "inflate::Dynamic block code description: repeat lengths with no first length",
      INCOMPLETE_CODES: "inflate::Dynamic block code description: code lengths codes incomplete",
      INVALID_DYN_DISTANCE: "inflate::Dynamic block code description: invalid distance code lengths",
      INVALID_CODES_LEN: "inflate::Dynamic block code description: invalid literal/length code lengths",
      INVALID_STORE_BLOCK: "inflate::Stored block length did not match one's complement",
      INVALID_BLOCK_TYPE: "inflate::Invalid block type (type == 3)",
      /* ADM-ZIP error messages */
      CANT_EXTRACT_FILE: "Could not extract the file",
      CANT_OVERRIDE: "Target file already exists",
      DISK_ENTRY_TOO_LARGE: "Number of disk entries is too large",
      NO_ZIP: "No zip file was loaded",
      NO_ENTRY: "Entry doesn't exist",
      DUPLICATE_ENTRY: "Duplicate entry name {0}",
      DIRECTORY_CONTENT_ERROR: "A directory cannot have content",
      FILE_NOT_FOUND: 'File not found: "{0}"',
      NOT_IMPLEMENTED: "Not implemented",
      INVALID_FILENAME: "Invalid filename",
      INVALID_FORMAT: "Invalid or unsupported zip format. No END header found",
      ZIP64_VALUE_TOO_LARGE: "Zip64 value exceeds the maximum safe integer",
      INVALID_PASS_PARAM: "Incompatible password parameter",
      WRONG_PASSWORD: "Wrong Password",
      /* ADM-ZIP */
      COMMENT_TOO_LONG: "Comment is too long",
      // Comment can be max 65535 bytes long (NOTE: some non-US characters may take more space)
      EXTRA_FIELD_PARSE_ERROR: "Extra field parsing error"
    };
    function E(message) {
      return function(...args) {
        if (args.length) {
          message = message.replace(/\{(\d)\}/g, (_, n) => args[n] || "");
        }
        return new Error("ADM-ZIP: " + message);
      };
    }
    for (const msg of Object.keys(errors)) {
      exports2[msg] = E(errors[msg]);
    }
  }
});

// node_modules/adm-zip/util/utils.js
var require_utils = __commonJS({
  "node_modules/adm-zip/util/utils.js"(exports2, module2) {
    var fsystem = require("fs");
    var pth = require("path");
    var Constants = require_constants();
    var Errors = require_errors();
    var isWin = typeof process === "object" && "win32" === process.platform;
    var is_Obj = (obj) => typeof obj === "object" && obj !== null;
    var crcTable = new Uint32Array(256).map((t, c) => {
      for (let k = 0; k < 8; k++) {
        if ((c & 1) !== 0) {
          c = 3988292384 ^ c >>> 1;
        } else {
          c >>>= 1;
        }
      }
      return c >>> 0;
    });
    function Utils(opts) {
      this.sep = pth.sep;
      this.fs = fsystem;
      if (is_Obj(opts)) {
        if (is_Obj(opts.fs) && typeof opts.fs.statSync === "function") {
          this.fs = opts.fs;
        }
      }
    }
    module2.exports = Utils;
    Utils.prototype.makeDir = function(folder) {
      const self = this;
      function mkdirSync(fpath) {
        let resolvedPath = fpath.split(self.sep)[0];
        fpath.split(self.sep).forEach(function(name) {
          if (!name || name.substr(-1, 1) === ":") return;
          resolvedPath += self.sep + name;
          var stat;
          try {
            stat = self.fs.statSync(resolvedPath);
          } catch (e) {
            if (e.message && e.message.startsWith("ENOENT")) {
              self.fs.mkdirSync(resolvedPath);
            } else {
              throw e;
            }
          }
          if (stat && stat.isFile()) throw Errors.FILE_IN_THE_WAY(`"${resolvedPath}"`);
        });
      }
      mkdirSync(folder);
    };
    Utils.prototype.writeFileTo = function(path9, content, overwrite, attr) {
      const self = this;
      if (self.fs.existsSync(path9)) {
        if (!overwrite) return false;
        var stat = self.fs.statSync(path9);
        if (stat.isDirectory()) {
          return false;
        }
      }
      var folder = pth.dirname(path9);
      if (!self.fs.existsSync(folder)) {
        self.makeDir(folder);
      }
      var fd;
      try {
        fd = self.fs.openSync(path9, "w", 438);
      } catch (e) {
        self.fs.chmodSync(path9, 438);
        fd = self.fs.openSync(path9, "w", 438);
      }
      if (fd) {
        try {
          self.fs.writeSync(fd, content, 0, content.length, 0);
        } finally {
          self.fs.closeSync(fd);
        }
      }
      self.fs.chmodSync(path9, attr || 438);
      return true;
    };
    Utils.prototype.writeFileToAsync = function(path9, content, overwrite, attr, callback) {
      if (typeof attr === "function") {
        callback = attr;
        attr = void 0;
      }
      const self = this;
      self.fs.exists(path9, function(exist) {
        if (exist && !overwrite) return callback(false);
        self.fs.stat(path9, function(err, stat) {
          if (exist && stat && stat.isDirectory()) {
            return callback(false);
          }
          var folder = pth.dirname(path9);
          self.fs.exists(folder, function(exists2) {
            if (!exists2) {
              try {
                self.makeDir(folder);
              } catch (e) {
                return callback(false);
              }
            }
            const writeToFd = function(fd) {
              self.fs.write(fd, content, 0, content.length, 0, function(writeErr) {
                self.fs.close(fd, function() {
                  if (writeErr) return callback(false);
                  self.fs.chmod(path9, attr || 438, function() {
                    callback(true);
                  });
                });
              });
            };
            self.fs.open(path9, "w", 438, function(err2, fd) {
              if (err2) {
                self.fs.chmod(path9, 438, function() {
                  self.fs.open(path9, "w", 438, function(retryErr, fd2) {
                    if (retryErr || !fd2) return callback(false);
                    writeToFd(fd2);
                  });
                });
              } else if (fd) {
                writeToFd(fd);
              } else {
                callback(false);
              }
            });
          });
        });
      });
    };
    Utils.prototype.assertPathSafe = function(root, target) {
      const self = this;
      if (typeof self.fs.lstatSync !== "function") return;
      const resolvedRoot = pth.resolve(root);
      const resolvedTarget = pth.resolve(target);
      if (resolvedTarget === resolvedRoot) return;
      const rel = pth.relative(resolvedRoot, resolvedTarget);
      if (!rel || rel === ".." || rel.startsWith(".." + pth.sep) || pth.isAbsolute(rel)) return;
      let cur = resolvedRoot;
      for (const part of rel.split(pth.sep)) {
        if (!part || part === ".") continue;
        cur = pth.join(cur, part);
        let stat;
        try {
          stat = self.fs.lstatSync(cur);
        } catch (e) {
          break;
        }
        if (stat.isSymbolicLink()) throw Errors.FILE_IN_THE_WAY(`"${cur}"`);
      }
    };
    Utils.prototype.findFiles = function(path9) {
      const self = this;
      const canLstat = typeof self.fs.lstatSync === "function";
      const rootReal = self.fs.realpathSync(path9);
      function escapesRoot(p) {
        if (!canLstat) return false;
        if (!self.fs.lstatSync(p).isSymbolicLink()) return false;
        let real;
        try {
          real = self.fs.realpathSync(p);
        } catch (e) {
          return true;
        }
        return !(real === rootReal || real.startsWith(rootReal + pth.sep));
      }
      function findSync(dir, pattern, recursive, visited) {
        if (typeof pattern === "boolean") {
          recursive = pattern;
          pattern = void 0;
        }
        let files = [];
        self.fs.readdirSync(dir).forEach(function(file) {
          const path10 = pth.join(dir, file);
          if (escapesRoot(path10)) return;
          const stat = self.fs.statSync(path10);
          if (!pattern || pattern.test(path10)) {
            files.push(pth.normalize(path10) + (stat.isDirectory() ? self.sep : ""));
          }
          if (stat.isDirectory() && recursive) {
            const realDir = self.fs.realpathSync(path10);
            if (!visited.has(realDir)) {
              visited.add(realDir);
              files = files.concat(findSync(path10, pattern, recursive, visited));
            }
          }
        });
        return files;
      }
      return findSync(path9, void 0, true, /* @__PURE__ */ new Set([rootReal]));
    };
    Utils.prototype.findFilesAsync = function(dir, cb) {
      const self = this;
      const results = [];
      let finished = false;
      const finish = function(err) {
        if (finished) return;
        finished = true;
        cb(err, err ? void 0 : results);
      };
      const canLstat = typeof self.fs.lstat === "function";
      let rootReal = null;
      const escapesRoot = function(file, cb2) {
        if (!canLstat) return cb2(null, false);
        self.fs.lstat(file, function(err, lst) {
          if (err) return cb2(err);
          if (!lst || !lst.isSymbolicLink()) return cb2(null, false);
          self.fs.realpath(file, function(err2, real) {
            if (err2) return cb2(null, true);
            cb2(null, !(real === rootReal || real.startsWith(rootReal + pth.sep)));
          });
        });
      };
      const walk = function(dir2, visited, done) {
        self.fs.readdir(dir2, function(err, list) {
          if (err) return done(err);
          let pending = list.length;
          if (!pending) return done();
          list.forEach(function(name) {
            const file = pth.join(dir2, name);
            escapesRoot(file, function(err2, escapes) {
              if (err2) return done(err2);
              if (escapes) {
                if (!--pending) done();
                return;
              }
              self.fs.stat(file, function(err3, stat) {
                if (err3) return done(err3);
                if (!stat) {
                  if (!--pending) done();
                  return;
                }
                results.push(pth.normalize(file) + (stat.isDirectory() ? self.sep : ""));
                if (!stat.isDirectory()) {
                  if (!--pending) done();
                  return;
                }
                self.fs.realpath(file, function(err4, realDir) {
                  if (err4) return done(err4);
                  if (visited.has(realDir)) {
                    if (!--pending) done();
                    return;
                  }
                  visited.add(realDir);
                  walk(file, visited, function(err5) {
                    if (err5) return done(err5);
                    if (!--pending) done();
                  });
                });
              });
            });
          });
        });
      };
      self.fs.realpath(dir, function(err, realDir) {
        if (err) return finish(err);
        rootReal = realDir;
        walk(dir, /* @__PURE__ */ new Set([realDir]), finish);
      });
    };
    Utils.prototype.getAttributes = function() {
    };
    Utils.prototype.setAttributes = function() {
    };
    Utils.crc32update = function(crc, byte) {
      return crcTable[(crc ^ byte) & 255] ^ crc >>> 8;
    };
    Utils.crc32 = function(buf) {
      if (typeof buf === "string") {
        buf = Buffer.from(buf, "utf8");
      }
      let len = buf.length;
      let crc = ~0;
      for (let off = 0; off < len; ) crc = Utils.crc32update(crc, buf[off++]);
      return ~crc >>> 0;
    };
    Utils.methodToString = function(method) {
      switch (method) {
        case Constants.STORED:
          return "STORED (" + method + ")";
        case Constants.DEFLATED:
          return "DEFLATED (" + method + ")";
        default:
          return "UNSUPPORTED (" + method + ")";
      }
    };
    Utils.canonical = function(path9) {
      if (!path9) return "";
      const safeSuffix = pth.posix.normalize("/" + path9.split("\\").join("/"));
      return pth.join(".", safeSuffix);
    };
    Utils.zipnamefix = function(path9) {
      if (!path9) return "";
      const safeSuffix = pth.posix.normalize("/" + path9.split("\\").join("/"));
      return pth.posix.join(".", safeSuffix);
    };
    Utils.findLast = function(arr, callback) {
      if (!Array.isArray(arr)) throw new TypeError("arr is not array");
      const len = arr.length >>> 0;
      for (let i = len - 1; i >= 0; i--) {
        if (callback(arr[i], i, arr)) {
          return arr[i];
        }
      }
      return void 0;
    };
    Utils.sanitize = function(prefix, name) {
      prefix = pth.resolve(pth.normalize(prefix));
      var parts = name.split("/");
      for (var i = 0, l = parts.length; i < l; i++) {
        var path9 = pth.normalize(pth.join(prefix, parts.slice(i, l).join(pth.sep)));
        if (path9 === prefix || path9.startsWith(prefix + pth.sep)) {
          return path9;
        }
      }
      return pth.normalize(pth.join(prefix, pth.basename(name)));
    };
    Utils.toBuffer = function toBuffer(input, encoder) {
      if (Buffer.isBuffer(input)) {
        return input;
      } else if (input instanceof Uint8Array) {
        return Buffer.from(input);
      } else {
        return typeof input === "string" ? encoder(input) : Buffer.alloc(0);
      }
    };
    Utils.readBigUInt64LE = function(buffer, index) {
      const lo = buffer.readUInt32LE(index);
      const hi = buffer.readUInt32LE(index + 4);
      const value = hi * 4294967296 + lo;
      if (value > Number.MAX_SAFE_INTEGER) {
        throw Errors.ZIP64_VALUE_TOO_LARGE();
      }
      return value;
    };
    Utils.writeBigUInt64LE = function(buffer, value, index) {
      const lo = value >>> 0;
      const hi = Math.floor(value / 4294967296) >>> 0;
      buffer.writeUInt32LE(lo, index);
      buffer.writeUInt32LE(hi, index + 4);
    };
    Utils.fromDOS2Date = function(val) {
      return new Date((val >> 25 & 127) + 1980, Math.max((val >> 21 & 15) - 1, 0), Math.max(val >> 16 & 31, 1), val >> 11 & 31, val >> 5 & 63, (val & 31) << 1);
    };
    Utils.fromDate2DOS = function(val) {
      let date = 0;
      let time = 0;
      if (val.getFullYear() > 1979) {
        date = (val.getFullYear() - 1980 & 127) << 9 | val.getMonth() + 1 << 5 | val.getDate();
        time = val.getHours() << 11 | val.getMinutes() << 5 | val.getSeconds() >> 1;
      }
      return date << 16 | time;
    };
    Utils.isWin = isWin;
    Utils.crcTable = crcTable;
  }
});

// node_modules/adm-zip/util/fattr.js
var require_fattr = __commonJS({
  "node_modules/adm-zip/util/fattr.js"(exports2, module2) {
    var pth = require("path");
    module2.exports = function(path9, { fs: fs9 }) {
      var _path = path9 || "", _obj = newAttr(), _stat = null;
      function newAttr() {
        return {
          directory: false,
          readonly: false,
          hidden: false,
          executable: false,
          mtime: 0,
          atime: 0
        };
      }
      if (_path && fs9.existsSync(_path)) {
        _stat = fs9.statSync(_path);
        _obj.directory = _stat.isDirectory();
        _obj.mtime = _stat.mtime;
        _obj.atime = _stat.atime;
        _obj.executable = (73 & _stat.mode) !== 0;
        _obj.readonly = (128 & _stat.mode) === 0;
        _obj.hidden = pth.basename(_path)[0] === ".";
      } else {
        console.warn("Invalid path: " + _path);
      }
      return {
        get directory() {
          return _obj.directory;
        },
        get readOnly() {
          return _obj.readonly;
        },
        get hidden() {
          return _obj.hidden;
        },
        get mtime() {
          return _obj.mtime;
        },
        get atime() {
          return _obj.atime;
        },
        get executable() {
          return _obj.executable;
        },
        decodeAttributes: function() {
        },
        encodeAttributes: function() {
        },
        toJSON: function() {
          return {
            path: _path,
            isDirectory: _obj.directory,
            isReadOnly: _obj.readonly,
            isHidden: _obj.hidden,
            isExecutable: _obj.executable,
            mTime: _obj.mtime,
            aTime: _obj.atime
          };
        },
        toString: function() {
          return JSON.stringify(this.toJSON(), null, "	");
        }
      };
    };
  }
});

// node_modules/adm-zip/util/decoder.js
var require_decoder = __commonJS({
  "node_modules/adm-zip/util/decoder.js"(exports2, module2) {
    module2.exports = {
      efs: true,
      encode: (data) => Buffer.from(data, "utf8"),
      decode: (data) => data.toString("utf8")
    };
  }
});

// node_modules/adm-zip/util/index.js
var require_util = __commonJS({
  "node_modules/adm-zip/util/index.js"(exports2, module2) {
    module2.exports = require_utils();
    module2.exports.Constants = require_constants();
    module2.exports.Errors = require_errors();
    module2.exports.FileAttr = require_fattr();
    module2.exports.decoder = require_decoder();
  }
});

// node_modules/adm-zip/headers/entryHeader.js
var require_entryHeader = __commonJS({
  "node_modules/adm-zip/headers/entryHeader.js"(exports2, module2) {
    var Utils = require_util();
    var Constants = Utils.Constants;
    module2.exports = function() {
      var _verMade = 20, _version = 10, _flags = 0, _method = 0, _time = 0, _crc = 0, _compressedSize = 0, _size = 0, _fnameLen = 0, _extraLen = 0, _comLen = 0, _diskStart = 0, _inattr = 0, _attr = 0, _offset = 0;
      _verMade |= Utils.isWin ? 2560 : 768;
      _flags |= Constants.FLG_EFS;
      const _localHeader = {
        extraLen: 0
      };
      const uint32 = (val) => Math.max(0, val) >>> 0;
      const uint16 = (val) => Math.max(0, val) & 65535;
      const uint8 = (val) => Math.max(0, val) & 255;
      _time = Utils.fromDate2DOS(/* @__PURE__ */ new Date());
      return {
        get made() {
          return _verMade;
        },
        set made(val) {
          _verMade = val;
        },
        get version() {
          return _version;
        },
        set version(val) {
          _version = val;
        },
        get flags() {
          return _flags;
        },
        set flags(val) {
          _flags = val;
        },
        get flags_efs() {
          return (_flags & Constants.FLG_EFS) > 0;
        },
        set flags_efs(val) {
          if (val) {
            _flags |= Constants.FLG_EFS;
          } else {
            _flags &= ~Constants.FLG_EFS;
          }
        },
        get flags_desc() {
          return (_flags & Constants.FLG_DESC) > 0;
        },
        set flags_desc(val) {
          if (val) {
            _flags |= Constants.FLG_DESC;
          } else {
            _flags &= ~Constants.FLG_DESC;
          }
        },
        get method() {
          return _method;
        },
        set method(val) {
          switch (val) {
            case Constants.STORED:
              this.version = 10;
              break;
            case Constants.DEFLATED:
            default:
              this.version = 20;
          }
          _method = val;
        },
        get time() {
          return Utils.fromDOS2Date(this.timeval);
        },
        set time(val) {
          val = new Date(val);
          this.timeval = Utils.fromDate2DOS(val);
        },
        get timeval() {
          return _time;
        },
        set timeval(val) {
          _time = uint32(val);
        },
        get timeHighByte() {
          return uint8(_time >>> 8);
        },
        get crc() {
          return _crc;
        },
        set crc(val) {
          _crc = uint32(val);
        },
        get compressedSize() {
          return _compressedSize;
        },
        set compressedSize(val) {
          _compressedSize = uint32(val);
        },
        get size() {
          return _size;
        },
        set size(val) {
          _size = uint32(val);
        },
        get fileNameLength() {
          return _fnameLen;
        },
        set fileNameLength(val) {
          _fnameLen = val;
        },
        get extraLength() {
          return _extraLen;
        },
        set extraLength(val) {
          _extraLen = val;
        },
        get extraLocalLength() {
          return _localHeader.extraLen;
        },
        set extraLocalLength(val) {
          _localHeader.extraLen = val;
        },
        get commentLength() {
          return _comLen;
        },
        set commentLength(val) {
          _comLen = val;
        },
        get diskNumStart() {
          return _diskStart;
        },
        set diskNumStart(val) {
          _diskStart = uint32(val);
        },
        get inAttr() {
          return _inattr;
        },
        set inAttr(val) {
          _inattr = uint32(val);
        },
        get attr() {
          return _attr;
        },
        set attr(val) {
          _attr = uint32(val);
        },
        // get Unix file permissions
        get fileAttr() {
          return (_attr || 0) >> 16 & 511;
        },
        get offset() {
          return _offset;
        },
        set offset(val) {
          _offset = uint32(val);
        },
        get encrypted() {
          return (_flags & Constants.FLG_ENC) === Constants.FLG_ENC;
        },
        get centralHeaderSize() {
          return Constants.CENHDR + _fnameLen + _extraLen + _comLen;
        },
        get realDataOffset() {
          return _offset + Constants.LOCHDR + _localHeader.fnameLen + _localHeader.extraLen;
        },
        get localHeader() {
          return _localHeader;
        },
        loadLocalHeaderFromBinary: function(input) {
          if (_offset < 0 || _offset + Constants.LOCHDR > input.length) {
            throw Utils.Errors.INVALID_LOC();
          }
          var data = input.slice(_offset, _offset + Constants.LOCHDR);
          if (data.readUInt32LE(0) !== Constants.LOCSIG) {
            throw Utils.Errors.INVALID_LOC();
          }
          _localHeader.version = data.readUInt16LE(Constants.LOCVER);
          _localHeader.flags = data.readUInt16LE(Constants.LOCFLG);
          _localHeader.flags_desc = (_localHeader.flags & Constants.FLG_DESC) > 0;
          _localHeader.method = data.readUInt16LE(Constants.LOCHOW);
          _localHeader.time = data.readUInt32LE(Constants.LOCTIM);
          _localHeader.crc = data.readUInt32LE(Constants.LOCCRC);
          _localHeader.compressedSize = data.readUInt32LE(Constants.LOCSIZ);
          _localHeader.size = data.readUInt32LE(Constants.LOCLEN);
          _localHeader.fnameLen = data.readUInt16LE(Constants.LOCNAM);
          _localHeader.extraLen = data.readUInt16LE(Constants.LOCEXT);
          const extraStart = _offset + Constants.LOCHDR + _localHeader.fnameLen;
          const extraEnd = extraStart + _localHeader.extraLen;
          return input.slice(extraStart, extraEnd);
        },
        loadFromBinary: function(data) {
          if (data.length !== Constants.CENHDR || data.readUInt32LE(0) !== Constants.CENSIG) {
            throw Utils.Errors.INVALID_CEN();
          }
          _verMade = data.readUInt16LE(Constants.CENVEM);
          _version = data.readUInt16LE(Constants.CENVER);
          _flags = data.readUInt16LE(Constants.CENFLG);
          _method = data.readUInt16LE(Constants.CENHOW);
          _time = data.readUInt32LE(Constants.CENTIM);
          _crc = data.readUInt32LE(Constants.CENCRC);
          _compressedSize = data.readUInt32LE(Constants.CENSIZ);
          _size = data.readUInt32LE(Constants.CENLEN);
          _fnameLen = data.readUInt16LE(Constants.CENNAM);
          _extraLen = data.readUInt16LE(Constants.CENEXT);
          _comLen = data.readUInt16LE(Constants.CENCOM);
          _diskStart = data.readUInt16LE(Constants.CENDSK);
          _inattr = data.readUInt16LE(Constants.CENATT);
          _attr = data.readUInt32LE(Constants.CENATX);
          _offset = data.readUInt32LE(Constants.CENOFF);
        },
        localHeaderToBinary: function() {
          var data = Buffer.alloc(Constants.LOCHDR);
          data.writeUInt32LE(Constants.LOCSIG, 0);
          data.writeUInt16LE(_version, Constants.LOCVER);
          data.writeUInt16LE(_flags & ~Constants.FLG_DESC, Constants.LOCFLG);
          data.writeUInt16LE(_method, Constants.LOCHOW);
          data.writeUInt32LE(_time, Constants.LOCTIM);
          data.writeUInt32LE(_crc, Constants.LOCCRC);
          data.writeUInt32LE(_compressedSize, Constants.LOCSIZ);
          data.writeUInt32LE(_size, Constants.LOCLEN);
          data.writeUInt16LE(_fnameLen, Constants.LOCNAM);
          data.writeUInt16LE(_localHeader.extraLen, Constants.LOCEXT);
          return data;
        },
        centralHeaderToBinary: function() {
          var data = Buffer.alloc(Constants.CENHDR + _fnameLen + _extraLen + _comLen);
          data.writeUInt32LE(Constants.CENSIG, 0);
          data.writeUInt16LE(_verMade, Constants.CENVEM);
          data.writeUInt16LE(_version, Constants.CENVER);
          data.writeUInt16LE(_flags & ~Constants.FLG_DESC, Constants.CENFLG);
          data.writeUInt16LE(_method, Constants.CENHOW);
          data.writeUInt32LE(_time, Constants.CENTIM);
          data.writeUInt32LE(_crc, Constants.CENCRC);
          data.writeUInt32LE(_compressedSize, Constants.CENSIZ);
          data.writeUInt32LE(_size, Constants.CENLEN);
          data.writeUInt16LE(_fnameLen, Constants.CENNAM);
          data.writeUInt16LE(_extraLen, Constants.CENEXT);
          data.writeUInt16LE(_comLen, Constants.CENCOM);
          data.writeUInt16LE(_diskStart, Constants.CENDSK);
          data.writeUInt16LE(_inattr, Constants.CENATT);
          data.writeUInt32LE(_attr, Constants.CENATX);
          data.writeUInt32LE(_offset, Constants.CENOFF);
          return data;
        },
        toJSON: function() {
          const bytes = function(nr) {
            return nr + " bytes";
          };
          return {
            made: _verMade,
            version: _version,
            flags: _flags,
            method: Utils.methodToString(_method),
            time: this.time,
            crc: "0x" + _crc.toString(16).toUpperCase(),
            compressedSize: bytes(_compressedSize),
            size: bytes(_size),
            fileNameLength: bytes(_fnameLen),
            extraLength: bytes(_extraLen),
            commentLength: bytes(_comLen),
            diskNumStart: _diskStart,
            inAttr: _inattr,
            attr: _attr,
            offset: _offset,
            centralHeaderSize: bytes(Constants.CENHDR + _fnameLen + _extraLen + _comLen)
          };
        },
        toString: function() {
          return JSON.stringify(this.toJSON(), null, "	");
        }
      };
    };
  }
});

// node_modules/adm-zip/headers/mainHeader.js
var require_mainHeader = __commonJS({
  "node_modules/adm-zip/headers/mainHeader.js"(exports2, module2) {
    var Utils = require_util();
    var Constants = Utils.Constants;
    module2.exports = function() {
      var _volumeEntries = 0, _totalEntries = 0, _size = 0, _offset = 0, _commentLength = 0;
      const needsZip64 = () => _volumeEntries > Constants.EF_ZIP64_OR_16 || _totalEntries > Constants.EF_ZIP64_OR_16 || _size > Constants.EF_ZIP64_OR_32 || _offset > Constants.EF_ZIP64_OR_32;
      return {
        get diskEntries() {
          return _volumeEntries;
        },
        set diskEntries(val) {
          _volumeEntries = _totalEntries = val;
        },
        get totalEntries() {
          return _totalEntries;
        },
        set totalEntries(val) {
          _totalEntries = _volumeEntries = val;
        },
        get size() {
          return _size;
        },
        set size(val) {
          _size = val;
        },
        get offset() {
          return _offset;
        },
        set offset(val) {
          _offset = val;
        },
        get commentLength() {
          return _commentLength;
        },
        set commentLength(val) {
          _commentLength = val;
        },
        get mainHeaderSize() {
          return (needsZip64() ? Constants.ZIP64HDR + Constants.END64HDR : 0) + Constants.ENDHDR + _commentLength;
        },
        loadFromBinary: function(data) {
          if ((data.length !== Constants.ENDHDR || data.readUInt32LE(0) !== Constants.ENDSIG) && (data.length < Constants.ZIP64HDR || data.readUInt32LE(0) !== Constants.ZIP64SIG)) {
            throw Utils.Errors.INVALID_END();
          }
          if (data.readUInt32LE(0) === Constants.ENDSIG) {
            _volumeEntries = data.readUInt16LE(Constants.ENDSUB);
            _totalEntries = data.readUInt16LE(Constants.ENDTOT);
            _size = data.readUInt32LE(Constants.ENDSIZ);
            _offset = data.readUInt32LE(Constants.ENDOFF);
            _commentLength = data.readUInt16LE(Constants.ENDCOM);
          } else {
            _volumeEntries = Utils.readBigUInt64LE(data, Constants.ZIP64SUB);
            _totalEntries = Utils.readBigUInt64LE(data, Constants.ZIP64TOT);
            _size = Utils.readBigUInt64LE(data, Constants.ZIP64SIZB);
            _offset = Utils.readBigUInt64LE(data, Constants.ZIP64OFF);
            _commentLength = 0;
          }
        },
        toBinary: function() {
          if (!needsZip64()) {
            var b = Buffer.alloc(Constants.ENDHDR + _commentLength);
            b.writeUInt32LE(Constants.ENDSIG, 0);
            b.writeUInt32LE(0, 4);
            b.writeUInt16LE(_volumeEntries, Constants.ENDSUB);
            b.writeUInt16LE(_totalEntries, Constants.ENDTOT);
            b.writeUInt32LE(_size, Constants.ENDSIZ);
            b.writeUInt32LE(_offset, Constants.ENDOFF);
            b.writeUInt16LE(_commentLength, Constants.ENDCOM);
            b.fill(" ", Constants.ENDHDR);
            return b;
          }
          var b = Buffer.alloc(this.mainHeaderSize);
          let offset = 0;
          b.writeUInt32LE(Constants.ZIP64SIG, offset);
          Utils.writeBigUInt64LE(b, Constants.ZIP64HDR - Constants.ZIP64LEAD, offset + Constants.ZIP64SIZE);
          b.writeUInt16LE(45, offset + Constants.ZIP64VEM);
          b.writeUInt16LE(45, offset + Constants.ZIP64VER);
          b.writeUInt32LE(0, offset + Constants.ZIP64DSK);
          b.writeUInt32LE(0, offset + Constants.ZIP64DSKDIR);
          Utils.writeBigUInt64LE(b, _volumeEntries, offset + Constants.ZIP64SUB);
          Utils.writeBigUInt64LE(b, _totalEntries, offset + Constants.ZIP64TOT);
          Utils.writeBigUInt64LE(b, _size, offset + Constants.ZIP64SIZB);
          Utils.writeBigUInt64LE(b, _offset, offset + Constants.ZIP64OFF);
          const zip64EndOffset = _offset + _size;
          offset += Constants.ZIP64HDR;
          b.writeUInt32LE(Constants.END64SIG, offset);
          b.writeUInt32LE(0, offset + Constants.END64START);
          Utils.writeBigUInt64LE(b, zip64EndOffset, offset + Constants.END64OFF);
          b.writeUInt32LE(1, offset + Constants.END64NUMDISKS);
          offset += Constants.END64HDR;
          b.writeUInt32LE(Constants.ENDSIG, offset);
          b.writeUInt32LE(0, offset + 4);
          b.writeUInt16LE(Math.min(_volumeEntries, Constants.EF_ZIP64_OR_16), offset + Constants.ENDSUB);
          b.writeUInt16LE(Math.min(_totalEntries, Constants.EF_ZIP64_OR_16), offset + Constants.ENDTOT);
          b.writeUInt32LE(Math.min(_size, Constants.EF_ZIP64_OR_32), offset + Constants.ENDSIZ);
          b.writeUInt32LE(Math.min(_offset, Constants.EF_ZIP64_OR_32), offset + Constants.ENDOFF);
          b.writeUInt16LE(_commentLength, offset + Constants.ENDCOM);
          b.fill(" ", offset + Constants.ENDHDR);
          return b;
        },
        toJSON: function() {
          const offset = function(nr, len) {
            let offs = nr.toString(16).toUpperCase();
            while (offs.length < len) offs = "0" + offs;
            return "0x" + offs;
          };
          return {
            diskEntries: _volumeEntries,
            totalEntries: _totalEntries,
            size: _size + " bytes",
            offset: offset(_offset, 4),
            commentLength: _commentLength
          };
        },
        toString: function() {
          return JSON.stringify(this.toJSON(), null, "	");
        }
      };
    };
  }
});

// node_modules/adm-zip/headers/index.js
var require_headers = __commonJS({
  "node_modules/adm-zip/headers/index.js"(exports2) {
    exports2.EntryHeader = require_entryHeader();
    exports2.MainHeader = require_mainHeader();
  }
});

// node_modules/adm-zip/methods/deflater.js
var require_deflater = __commonJS({
  "node_modules/adm-zip/methods/deflater.js"(exports2, module2) {
    module2.exports = function(inbuf) {
      var zlib = require("zlib");
      var opts = { chunkSize: (parseInt(inbuf.length / 1024) + 1) * 1024 };
      return {
        deflate: function() {
          return zlib.deflateRawSync(inbuf, opts);
        },
        deflateAsync: function(callback) {
          var tmp = zlib.createDeflateRaw(opts), parts = [], total = 0;
          tmp.on("data", function(data) {
            parts.push(data);
            total += data.length;
          });
          tmp.on("end", function() {
            var buf = Buffer.alloc(total), written = 0;
            buf.fill(0);
            for (var i = 0; i < parts.length; i++) {
              var part = parts[i];
              part.copy(buf, written);
              written += part.length;
            }
            callback && callback(buf);
          });
          tmp.end(inbuf);
        }
      };
    };
  }
});

// node_modules/adm-zip/methods/inflater.js
var require_inflater = __commonJS({
  "node_modules/adm-zip/methods/inflater.js"(exports2, module2) {
    var version = +(process?.versions?.node ?? "").split(".")[0] || 0;
    var Errors = require_errors();
    module2.exports = function(inbuf, expectedLength) {
      var zlib = require("zlib");
      const maxOutputLength = expectedLength > 0 ? expectedLength : 1;
      const option = version >= 15 ? { maxOutputLength } : {};
      return {
        inflate: function() {
          return zlib.inflateRawSync(inbuf, option);
        },
        inflateAsync: function(callback) {
          var tmp = zlib.createInflateRaw(option), parts = [], total = 0, done = false;
          const fail = function(err) {
            if (done) return;
            done = true;
            tmp.destroy();
            callback && callback(Buffer.alloc(0), err);
          };
          tmp.on("error", function(err) {
            fail(err);
          });
          tmp.on("data", function(data) {
            if (done) return;
            total += data.length;
            if (total > maxOutputLength) {
              return fail(Errors.MAX_OUTPUT_EXCEEDED());
            }
            parts.push(data);
          });
          tmp.on("end", function() {
            if (done) return;
            done = true;
            var buf = Buffer.alloc(total), written = 0;
            buf.fill(0);
            for (var i = 0; i < parts.length; i++) {
              var part = parts[i];
              part.copy(buf, written);
              written += part.length;
            }
            callback && callback(buf);
          });
          tmp.end(inbuf);
        }
      };
    };
  }
});

// node_modules/adm-zip/methods/zipcrypto.js
var require_zipcrypto = __commonJS({
  "node_modules/adm-zip/methods/zipcrypto.js"(exports2, module2) {
    "use strict";
    var { randomFillSync } = require("crypto");
    var Errors = require_errors();
    var crctable = new Uint32Array(256).map((t, crc) => {
      for (let j = 0; j < 8; j++) {
        if (0 !== (crc & 1)) {
          crc = crc >>> 1 ^ 3988292384;
        } else {
          crc >>>= 1;
        }
      }
      return crc >>> 0;
    });
    var uMul = (a, b) => Math.imul(a, b) >>> 0;
    var crc32update = (pCrc32, bval) => {
      return crctable[(pCrc32 ^ bval) & 255] ^ pCrc32 >>> 8;
    };
    var genSalt = () => {
      if ("function" === typeof randomFillSync) {
        return randomFillSync(Buffer.alloc(12));
      } else {
        return genSalt.node();
      }
    };
    genSalt.node = () => {
      const salt = Buffer.alloc(12);
      const len = salt.length;
      for (let i = 0; i < len; i++) salt[i] = Math.random() * 256 & 255;
      return salt;
    };
    var config = {
      genSalt
    };
    function Initkeys(pw) {
      const pass = Buffer.isBuffer(pw) ? pw : Buffer.from(pw);
      this.keys = new Uint32Array([305419896, 591751049, 878082192]);
      for (let i = 0; i < pass.length; i++) {
        this.updateKeys(pass[i]);
      }
    }
    Initkeys.prototype.updateKeys = function(byteValue) {
      const keys = this.keys;
      keys[0] = crc32update(keys[0], byteValue);
      keys[1] += keys[0] & 255;
      keys[1] = uMul(keys[1], 134775813) + 1;
      keys[2] = crc32update(keys[2], keys[1] >>> 24);
      return byteValue;
    };
    Initkeys.prototype.next = function() {
      const k = (this.keys[2] | 2) >>> 0;
      return uMul(k, k ^ 1) >> 8 & 255;
    };
    function make_decrypter(pwd) {
      const keys = new Initkeys(pwd);
      return function(data) {
        const result = Buffer.alloc(data.length);
        let pos = 0;
        for (let c of data) {
          result[pos++] = keys.updateKeys(c ^ keys.next());
        }
        return result;
      };
    }
    function make_encrypter(pwd) {
      const keys = new Initkeys(pwd);
      return function(data, result, pos = 0) {
        if (!result) result = Buffer.alloc(data.length);
        for (let c of data) {
          const k = keys.next();
          result[pos++] = c ^ k;
          keys.updateKeys(c);
        }
        return result;
      };
    }
    function decrypt(data, header, pwd) {
      if (!data || !Buffer.isBuffer(data) || data.length < 12) {
        return Buffer.alloc(0);
      }
      const decrypter = make_decrypter(pwd);
      const salt = decrypter(data.slice(0, 12));
      const verifyByte = (header.flags & 8) === 8 ? header.timeHighByte : header.crc >>> 24;
      if (salt[11] !== verifyByte) {
        throw Errors.WRONG_PASSWORD();
      }
      return decrypter(data.slice(12));
    }
    function _salter(data) {
      if (Buffer.isBuffer(data) && data.length >= 12) {
        config.genSalt = function() {
          return data.slice(0, 12);
        };
      } else if (data === "node") {
        config.genSalt = genSalt.node;
      } else {
        config.genSalt = genSalt;
      }
    }
    function encrypt(data, header, pwd, oldlike = false) {
      if (data == null) data = Buffer.alloc(0);
      if (!Buffer.isBuffer(data)) data = Buffer.from(data.toString());
      const encrypter = make_encrypter(pwd);
      const salt = config.genSalt();
      salt[11] = header.crc >>> 24 & 255;
      if (oldlike) salt[10] = header.crc >>> 16 & 255;
      const result = Buffer.alloc(data.length + 12);
      encrypter(salt, result);
      return encrypter(data, result, 12);
    }
    module2.exports = { decrypt, encrypt, _salter };
  }
});

// node_modules/adm-zip/methods/index.js
var require_methods = __commonJS({
  "node_modules/adm-zip/methods/index.js"(exports2) {
    exports2.Deflater = require_deflater();
    exports2.Inflater = require_inflater();
    exports2.ZipCrypto = require_zipcrypto();
  }
});

// node_modules/adm-zip/zipEntry.js
var require_zipEntry = __commonJS({
  "node_modules/adm-zip/zipEntry.js"(exports2, module2) {
    var Utils = require_util();
    var Headers = require_headers();
    var Constants = Utils.Constants;
    var Methods = require_methods();
    module2.exports = function(options, input) {
      var _centralHeader = new Headers.EntryHeader(), _entryName = Buffer.alloc(0), _comment = Buffer.alloc(0), _isDirectory = false, uncompressedData = null, _extra = Buffer.alloc(0), _extralocal = Buffer.alloc(0), _efs = true;
      const opts = options;
      const decoder = typeof opts.decoder === "object" ? opts.decoder : Utils.decoder;
      _efs = decoder.hasOwnProperty("efs") ? decoder.efs : false;
      function getCompressedDataFromZip() {
        if (!input || !(input instanceof Uint8Array)) {
          return Buffer.alloc(0);
        }
        _extralocal = _centralHeader.loadLocalHeaderFromBinary(input);
        const dataOffset = _centralHeader.realDataOffset;
        const dataEnd = dataOffset + _centralHeader.compressedSize;
        if (dataOffset < 0 || dataEnd < dataOffset || dataEnd > input.length) {
          throw Utils.Errors.INVALID_LOC();
        }
        return input.slice(dataOffset, dataEnd);
      }
      function crc32OK(data) {
        const expectedCrc = _centralHeader.flags_desc || _centralHeader.localHeader.flags_desc ? _centralHeader.crc : _centralHeader.localHeader.crc;
        return Utils.crc32(data) === expectedCrc;
      }
      function decompress(async, callback, pass) {
        if (typeof callback === "undefined" && typeof async === "string") {
          pass = async;
          async = void 0;
        }
        if (_isDirectory) {
          if (async && callback) {
            callback(Buffer.alloc(0), Utils.Errors.DIRECTORY_CONTENT_ERROR());
          }
          return Buffer.alloc(0);
        }
        var compressedData;
        try {
          compressedData = getCompressedDataFromZip();
          if (compressedData.length === 0) {
            if (async && callback) callback(compressedData);
            return compressedData;
          }
          if (_centralHeader.encrypted) {
            if ("string" !== typeof pass && !Buffer.isBuffer(pass)) {
              throw Utils.Errors.INVALID_PASS_PARAM();
            }
            compressedData = Methods.ZipCrypto.decrypt(compressedData, _centralHeader, pass);
          }
        } catch (err) {
          if (async && callback) {
            callback(Buffer.alloc(0), err);
            return Buffer.alloc(0);
          }
          throw err;
        }
        var data;
        switch (_centralHeader.method) {
          case Utils.Constants.STORED:
            data = Buffer.alloc(compressedData.length);
            compressedData.copy(data);
            if (!crc32OK(data)) {
              if (async && callback) callback(data, Utils.Errors.BAD_CRC());
              throw Utils.Errors.BAD_CRC();
            } else {
              if (async && callback) callback(data);
              return data;
            }
          case Utils.Constants.DEFLATED:
            var inflater = new Methods.Inflater(compressedData, _centralHeader.size);
            if (!async) {
              data = inflater.inflate();
              if (!crc32OK(data)) {
                throw Utils.Errors.BAD_CRC(`"${decoder.decode(_entryName)}"`);
              }
              return data;
            } else {
              inflater.inflateAsync(function(result, err) {
                if (!callback) return;
                if (err) {
                  callback(Buffer.alloc(0), err);
                } else if (!crc32OK(result)) {
                  callback(result, Utils.Errors.BAD_CRC());
                } else {
                  callback(result);
                }
              });
            }
            break;
          default:
            if (async && callback) callback(Buffer.alloc(0), Utils.Errors.UNKNOWN_METHOD());
            throw Utils.Errors.UNKNOWN_METHOD();
        }
      }
      function compress(async, callback) {
        if ((!uncompressedData || !uncompressedData.length) && Buffer.isBuffer(input)) {
          if (async && callback) callback(getCompressedDataFromZip());
          return getCompressedDataFromZip();
        }
        if (uncompressedData.length && !_isDirectory) {
          var compressedData;
          switch (_centralHeader.method) {
            case Utils.Constants.STORED:
              _centralHeader.compressedSize = _centralHeader.size;
              compressedData = Buffer.alloc(uncompressedData.length);
              uncompressedData.copy(compressedData);
              if (async && callback) callback(compressedData);
              return compressedData;
            default:
            case Utils.Constants.DEFLATED:
              var deflater = new Methods.Deflater(uncompressedData);
              if (!async) {
                var deflated = deflater.deflate();
                _centralHeader.compressedSize = deflated.length;
                return deflated;
              } else {
                deflater.deflateAsync(function(data) {
                  compressedData = Buffer.alloc(data.length);
                  _centralHeader.compressedSize = data.length;
                  data.copy(compressedData);
                  callback && callback(compressedData);
                });
              }
              deflater = null;
              break;
          }
        } else if (async && callback) {
          callback(Buffer.alloc(0));
        } else {
          return Buffer.alloc(0);
        }
      }
      function readUInt64LE(buffer, offset) {
        return Utils.readBigUInt64LE(buffer, offset);
      }
      function parseExtra(data) {
        try {
          var offset = 0;
          var signature, size, part;
          while (offset + 4 < data.length) {
            signature = data.readUInt16LE(offset);
            offset += 2;
            size = data.readUInt16LE(offset);
            offset += 2;
            part = data.slice(offset, offset + size);
            offset += size;
            if (Constants.ID_ZIP64 === signature) {
              parseZip64ExtendedInformation(part);
            }
          }
        } catch (error) {
          throw Utils.Errors.EXTRA_FIELD_PARSE_ERROR();
        }
      }
      function parseZip64ExtendedInformation(data) {
        var size, compressedSize, offset, diskNumStart;
        if (data.length >= Constants.EF_ZIP64_SCOMP) {
          size = readUInt64LE(data, Constants.EF_ZIP64_SUNCOMP);
          if (_centralHeader.size === Constants.EF_ZIP64_OR_32) {
            _centralHeader.size = size;
          }
        }
        if (data.length >= Constants.EF_ZIP64_RHO) {
          compressedSize = readUInt64LE(data, Constants.EF_ZIP64_SCOMP);
          if (_centralHeader.compressedSize === Constants.EF_ZIP64_OR_32) {
            _centralHeader.compressedSize = compressedSize;
          }
        }
        if (data.length >= Constants.EF_ZIP64_DSN) {
          offset = readUInt64LE(data, Constants.EF_ZIP64_RHO);
          if (_centralHeader.offset === Constants.EF_ZIP64_OR_32) {
            _centralHeader.offset = offset;
          }
        }
        if (data.length >= Constants.EF_ZIP64_DSN + 4) {
          diskNumStart = data.readUInt32LE(Constants.EF_ZIP64_DSN);
          if (_centralHeader.diskNumStart === Constants.EF_ZIP64_OR_16) {
            _centralHeader.diskNumStart = diskNumStart;
          }
        }
      }
      return {
        get entryName() {
          return decoder.decode(_entryName);
        },
        get rawEntryName() {
          return _entryName;
        },
        set entryName(val) {
          _entryName = Utils.toBuffer(val, decoder.encode);
          var lastChar = _entryName[_entryName.length - 1];
          _isDirectory = lastChar === 47 || lastChar === 92;
          _centralHeader.fileNameLength = _entryName.length;
        },
        get efs() {
          if (typeof _efs === "function") {
            return _efs(this.entryName);
          } else {
            return _efs;
          }
        },
        get extra() {
          return _extra;
        },
        set extra(val) {
          _extra = val;
          _centralHeader.extraLength = val.length;
          parseExtra(val);
        },
        get comment() {
          return decoder.decode(_comment);
        },
        set comment(val) {
          _comment = Utils.toBuffer(val, decoder.encode);
          _centralHeader.commentLength = _comment.length;
          if (_comment.length > 65535) throw Utils.Errors.COMMENT_TOO_LONG();
        },
        get name() {
          const n = decoder.decode(_entryName);
          return _isDirectory ? n.replace(/[/\\]$/, "").split("/").pop() : n.split("/").pop();
        },
        get isDirectory() {
          return _isDirectory;
        },
        getCompressedData: function() {
          return compress(false, null);
        },
        getCompressedDataAsync: function(callback) {
          compress(true, callback);
        },
        setData: function(value) {
          uncompressedData = Utils.toBuffer(value, Utils.decoder.encode);
          if (!_isDirectory && uncompressedData.length) {
            _centralHeader.size = uncompressedData.length;
            _centralHeader.method = Utils.Constants.DEFLATED;
            _centralHeader.crc = Utils.crc32(value);
            _centralHeader.changed = true;
          } else {
            _centralHeader.method = Utils.Constants.STORED;
          }
        },
        getData: function(pass) {
          if (_centralHeader.changed) {
            return uncompressedData;
          } else {
            return decompress(false, null, pass);
          }
        },
        getDataAsync: function(callback, pass) {
          if (_centralHeader.changed) {
            callback(uncompressedData);
          } else {
            decompress(true, callback, pass);
          }
        },
        set attr(attr) {
          _centralHeader.attr = attr;
        },
        get attr() {
          return _centralHeader.attr;
        },
        set header(data) {
          _centralHeader.loadFromBinary(data);
        },
        get header() {
          return _centralHeader;
        },
        packCentralHeader: function() {
          _centralHeader.flags_efs = this.efs;
          _centralHeader.extraLength = _extra.length;
          var header = _centralHeader.centralHeaderToBinary();
          var addpos = Utils.Constants.CENHDR;
          _entryName.copy(header, addpos);
          addpos += _entryName.length;
          _extra.copy(header, addpos);
          addpos += _centralHeader.extraLength;
          _comment.copy(header, addpos);
          return header;
        },
        packLocalHeader: function() {
          let addpos = 0;
          _centralHeader.flags_efs = this.efs;
          _centralHeader.extraLocalLength = _extralocal.length;
          const localHeaderBuf = _centralHeader.localHeaderToBinary();
          const localHeader = Buffer.alloc(localHeaderBuf.length + _entryName.length + _centralHeader.extraLocalLength);
          localHeaderBuf.copy(localHeader, addpos);
          addpos += localHeaderBuf.length;
          _entryName.copy(localHeader, addpos);
          addpos += _entryName.length;
          _extralocal.copy(localHeader, addpos);
          addpos += _extralocal.length;
          return localHeader;
        },
        toJSON: function() {
          const bytes = function(nr) {
            return "<" + (nr && nr.length + " bytes buffer" || "null") + ">";
          };
          return {
            entryName: this.entryName,
            name: this.name,
            comment: this.comment,
            isDirectory: this.isDirectory,
            header: _centralHeader.toJSON(),
            compressedData: bytes(input),
            data: bytes(uncompressedData)
          };
        },
        toString: function() {
          return JSON.stringify(this.toJSON(), null, "	");
        }
      };
    };
  }
});

// node_modules/adm-zip/zipFile.js
var require_zipFile = __commonJS({
  "node_modules/adm-zip/zipFile.js"(exports2, module2) {
    var ZipEntry = require_zipEntry();
    var Headers = require_headers();
    var Utils = require_util();
    module2.exports = function(inBuffer, options) {
      var entryList = [], entryTable = /* @__PURE__ */ Object.create(null), _comment = Buffer.alloc(0), mainHeader = new Headers.MainHeader(), loadedEntries = false;
      var password = null;
      const temporary = /* @__PURE__ */ new Set();
      const opts = options;
      const { noSort, decoder } = opts;
      if (inBuffer) {
        readMainHeader(opts.readEntries);
      } else {
        loadedEntries = true;
      }
      function makeTemporaryFolders() {
        const foldersList = /* @__PURE__ */ new Set();
        for (const elem of Object.keys(entryTable)) {
          const elements = elem.split("/");
          elements.pop();
          if (!elements.length) continue;
          for (let i = 0; i < elements.length; i++) {
            const sub = elements.slice(0, i + 1).join("/") + "/";
            foldersList.add(sub);
          }
        }
        for (const elem of foldersList) {
          if (!(elem in entryTable)) {
            const tempfolder = new ZipEntry(opts);
            tempfolder.entryName = elem;
            tempfolder.attr = 16;
            tempfolder.temporary = true;
            entryList.push(tempfolder);
            entryTable[tempfolder.entryName] = tempfolder;
            temporary.add(tempfolder);
          }
        }
      }
      function readEntries() {
        loadedEntries = true;
        entryTable = /* @__PURE__ */ Object.create(null);
        if (mainHeader.diskEntries > (inBuffer.length - mainHeader.offset) / Utils.Constants.CENHDR) {
          throw Utils.Errors.DISK_ENTRY_TOO_LARGE();
        }
        entryList = new Array(mainHeader.diskEntries);
        var index = mainHeader.offset;
        for (var i = 0; i < entryList.length; i++) {
          var tmp = index, entry = new ZipEntry(opts, inBuffer);
          entry.header = inBuffer.slice(tmp, tmp += Utils.Constants.CENHDR);
          entry.entryName = inBuffer.slice(tmp, tmp += entry.header.fileNameLength);
          if (entry.header.extraLength) {
            entry.extra = inBuffer.slice(tmp, tmp += entry.header.extraLength);
          }
          if (entry.header.commentLength) entry.comment = inBuffer.slice(tmp, tmp + entry.header.commentLength);
          index += entry.header.centralHeaderSize;
          if (entry.entryName in entryTable) {
            throw Utils.Errors.DUPLICATE_ENTRY(`"${entry.entryName}"`);
          }
          entryList[i] = entry;
          entryTable[entry.entryName] = entry;
        }
        temporary.clear();
        makeTemporaryFolders();
      }
      function readMainHeader(readNow) {
        var i = inBuffer.length - Utils.Constants.ENDHDR, max = Math.max(0, i - 65535), n = max, endStart = inBuffer.length, endOffset = -1, commentEnd = 0;
        const trailingSpace = typeof opts.trailingSpace === "boolean" ? opts.trailingSpace : false;
        if (trailingSpace) max = 0;
        for (i; i >= n; i--) {
          if (inBuffer[i] !== 80) continue;
          if (inBuffer.readUInt32LE(i) === Utils.Constants.ENDSIG) {
            endOffset = i;
            commentEnd = i;
            endStart = i + Utils.Constants.ENDHDR;
            n = i - Utils.Constants.END64HDR;
            continue;
          }
          if (inBuffer.readUInt32LE(i) === Utils.Constants.END64SIG) {
            n = max;
            continue;
          }
          if (inBuffer.readUInt32LE(i) === Utils.Constants.ZIP64SIG) {
            endOffset = i;
            endStart = i + Utils.readBigUInt64LE(inBuffer, i + Utils.Constants.ZIP64SIZE) + Utils.Constants.ZIP64LEAD;
            break;
          }
        }
        if (endOffset == -1) throw Utils.Errors.INVALID_FORMAT();
        mainHeader.loadFromBinary(inBuffer.slice(endOffset, endStart));
        if (mainHeader.commentLength) {
          _comment = inBuffer.slice(commentEnd + Utils.Constants.ENDHDR);
        }
        if (readNow) readEntries();
      }
      function sortEntries() {
        if (entryList.length > 1 && !noSort) {
          entryList = entryList.map((entry) => ({ entry, key: entry.entryName.toLowerCase() })).sort((a, b) => a.key.localeCompare(b.key)).map((pair) => pair.entry);
        }
      }
      return {
        /**
         * Returns an array of ZipEntry objects existent in the current opened archive
         * @return Array
         */
        get entries() {
          if (!loadedEntries) {
            readEntries();
          }
          return entryList.filter((e) => !temporary.has(e));
        },
        /**
         * Archive comment
         * @return {String}
         */
        get comment() {
          return decoder.decode(_comment);
        },
        set comment(val) {
          _comment = Utils.toBuffer(val, decoder.encode);
          mainHeader.commentLength = _comment.length;
        },
        getEntryCount: function() {
          if (!loadedEntries) {
            return mainHeader.diskEntries;
          }
          return entryList.length;
        },
        forEach: function(callback) {
          this.entries.forEach(callback);
        },
        /**
         * Returns a reference to the entry with the given name or null if entry is inexistent
         *
         * @param entryName
         * @return ZipEntry
         */
        getEntry: function(entryName) {
          if (!loadedEntries) {
            readEntries();
          }
          return entryTable[entryName] || null;
        },
        /**
         * Adds the given entry to the entry list
         *
         * @param entry
         */
        setEntry: function(entry) {
          if (!loadedEntries) {
            readEntries();
          }
          entryList.push(entry);
          entryTable[entry.entryName] = entry;
          mainHeader.totalEntries = entryList.length;
        },
        /**
         * Removes the file with the given name from the entry list.
         *
         * If the entry is a directory, then all nested files and directories will be removed
         * @param entryName
         * @returns {void}
         */
        deleteFile: function(entryName, withsubfolders = true) {
          if (!loadedEntries) {
            readEntries();
          }
          const entry = entryTable[entryName];
          const list = this.getEntryChildren(entry, withsubfolders).map((child) => child.entryName);
          list.forEach(this.deleteEntry);
        },
        /**
         * Removes the entry with the given name from the entry list.
         *
         * @param {string} entryName
         * @returns {void}
         */
        deleteEntry: function(entryName) {
          if (!loadedEntries) {
            readEntries();
          }
          const entry = entryTable[entryName];
          const index = entryList.indexOf(entry);
          if (index >= 0) {
            entryList.splice(index, 1);
            delete entryTable[entryName];
            mainHeader.totalEntries = entryList.length;
          }
        },
        /**
         *  Iterates and returns all nested files and directories of the given entry
         *
         * @param entry
         * @return Array
         */
        getEntryChildren: function(entry, subfolders = true) {
          if (!loadedEntries) {
            readEntries();
          }
          if (typeof entry === "object") {
            if (entry.isDirectory && subfolders) {
              const list = [];
              const name = entry.entryName;
              for (const zipEntry of entryList) {
                if (zipEntry.entryName.startsWith(name)) {
                  list.push(zipEntry);
                }
              }
              return list;
            } else {
              return [entry];
            }
          }
          return [];
        },
        /**
         *  How many child elements entry has
         *
         * @param {ZipEntry} entry
         * @return {integer}
         */
        getChildCount: function(entry) {
          if (entry && entry.isDirectory) {
            const list = this.getEntryChildren(entry);
            return list.includes(entry) ? list.length - 1 : list.length;
          }
          return 0;
        },
        /**
         * Returns the zip file
         *
         * @return Buffer
         */
        compressToBuffer: function() {
          if (!loadedEntries) {
            readEntries();
          }
          sortEntries();
          const dataBlock = [];
          const headerBlocks = [];
          let totalSize = 0;
          let dindex = 0;
          mainHeader.size = 0;
          mainHeader.offset = 0;
          let totalEntries = 0;
          for (const entry of this.entries) {
            const compressedData = entry.getCompressedData();
            entry.header.offset = dindex;
            const localHeader = entry.packLocalHeader();
            const dataLength = localHeader.length + compressedData.length;
            dindex += dataLength;
            dataBlock.push(localHeader);
            dataBlock.push(compressedData);
            const centralHeader = entry.packCentralHeader();
            headerBlocks.push(centralHeader);
            mainHeader.size += centralHeader.length;
            totalSize += dataLength + centralHeader.length;
            totalEntries++;
          }
          totalSize += mainHeader.mainHeaderSize;
          mainHeader.offset = dindex;
          mainHeader.totalEntries = totalEntries;
          dindex = 0;
          const outBuffer = Buffer.alloc(totalSize);
          for (const content of dataBlock) {
            content.copy(outBuffer, dindex);
            dindex += content.length;
          }
          for (const content of headerBlocks) {
            content.copy(outBuffer, dindex);
            dindex += content.length;
          }
          const mh = mainHeader.toBinary();
          if (_comment) {
            _comment.copy(mh, mh.length - _comment.length);
          }
          mh.copy(outBuffer, dindex);
          inBuffer = outBuffer;
          loadedEntries = false;
          return outBuffer;
        },
        toAsyncBuffer: function(onSuccess, onFail, onItemStart, onItemEnd) {
          try {
            if (!loadedEntries) {
              readEntries();
            }
            sortEntries();
            const dataBlock = [];
            const centralHeaders = [];
            let totalSize = 0;
            let dindex = 0;
            let totalEntries = 0;
            mainHeader.size = 0;
            mainHeader.offset = 0;
            const compress2Buffer = function(entryLists) {
              if (entryLists.length > 0) {
                const entry = entryLists.shift();
                const name = entry.entryName + entry.extra.toString();
                if (onItemStart) onItemStart(name);
                entry.getCompressedDataAsync(function(compressedData) {
                  if (onItemEnd) onItemEnd(name);
                  entry.header.offset = dindex;
                  const localHeader = entry.packLocalHeader();
                  const dataLength = localHeader.length + compressedData.length;
                  dindex += dataLength;
                  dataBlock.push(localHeader);
                  dataBlock.push(compressedData);
                  const centalHeader = entry.packCentralHeader();
                  centralHeaders.push(centalHeader);
                  mainHeader.size += centalHeader.length;
                  totalSize += dataLength + centalHeader.length;
                  totalEntries++;
                  compress2Buffer(entryLists);
                });
              } else {
                totalSize += mainHeader.mainHeaderSize;
                mainHeader.offset = dindex;
                mainHeader.totalEntries = totalEntries;
                dindex = 0;
                const outBuffer = Buffer.alloc(totalSize);
                dataBlock.forEach(function(content) {
                  content.copy(outBuffer, dindex);
                  dindex += content.length;
                });
                centralHeaders.forEach(function(content) {
                  content.copy(outBuffer, dindex);
                  dindex += content.length;
                });
                const mh = mainHeader.toBinary();
                if (_comment) {
                  _comment.copy(mh, mh.length - _comment.length);
                }
                mh.copy(outBuffer, dindex);
                inBuffer = outBuffer;
                loadedEntries = false;
                onSuccess(outBuffer);
              }
            };
            compress2Buffer(Array.from(this.entries));
          } catch (e) {
            onFail(e);
          }
        }
      };
    };
  }
});

// node_modules/adm-zip/adm-zip.js
var require_adm_zip = __commonJS({
  "node_modules/adm-zip/adm-zip.js"(exports2, module2) {
    var Utils = require_util();
    var pth = require("path");
    var ZipEntry = require_zipEntry();
    var ZipFile = require_zipFile();
    var get_Bool = (...val) => Utils.findLast(val, (c) => typeof c === "boolean");
    var get_Str = (...val) => Utils.findLast(val, (c) => typeof c === "string");
    var get_Fun = (...val) => Utils.findLast(val, (c) => typeof c === "function");
    var defaultOptions = {
      // option "noSort" : if true it disables files sorting
      noSort: false,
      // read entries during load (initial loading may be slower)
      readEntries: false,
      // default method is none
      method: Utils.Constants.NONE,
      // file system
      fs: null
    };
    module2.exports = function(input, options) {
      let inBuffer = null;
      const opts = Object.assign(/* @__PURE__ */ Object.create(null), defaultOptions);
      if (input && "object" === typeof input) {
        if (!(input instanceof Uint8Array)) {
          Object.assign(opts, input);
          input = opts.input ? opts.input : void 0;
          if (opts.input) delete opts.input;
        }
        if (Buffer.isBuffer(input)) {
          inBuffer = input;
          opts.method = Utils.Constants.BUFFER;
          input = void 0;
        }
      }
      Object.assign(opts, options);
      const filetools = new Utils(opts);
      const applyDirAttributes = (dirEntries) => {
        dirEntries.filter((d) => d.attr).sort((a, b) => b.path.length - a.path.length).forEach((d) => filetools.fs.chmodSync(d.path, d.attr));
      };
      if (typeof opts.decoder !== "object" || typeof opts.decoder.encode !== "function" || typeof opts.decoder.decode !== "function") {
        opts.decoder = Utils.decoder;
      }
      if (input && "string" === typeof input) {
        if (filetools.fs.existsSync(input)) {
          opts.method = Utils.Constants.FILE;
          opts.filename = input;
          inBuffer = filetools.fs.readFileSync(input);
        } else {
          throw Utils.Errors.INVALID_FILENAME();
        }
      }
      const _zip = new ZipFile(inBuffer, opts);
      const { canonical, sanitize, zipnamefix } = Utils;
      function getEntry(entry) {
        if (entry && _zip) {
          var item;
          if (typeof entry === "string") item = _zip.getEntry(pth.posix.normalize(entry));
          if (typeof entry === "object" && typeof entry.entryName !== "undefined" && typeof entry.header !== "undefined") item = _zip.getEntry(entry.entryName);
          if (item) {
            return item;
          }
        }
        return null;
      }
      function fixPath(zipPath) {
        const { join, normalize, sep } = pth.posix;
        return join(pth.isAbsolute(zipPath) ? "/" : ".", normalize(sep + zipPath.split("\\").join(sep) + sep));
      }
      function filenameFilter(filterfn) {
        if (filterfn instanceof RegExp) {
          return /* @__PURE__ */ (function(rx) {
            return function(filename) {
              return rx.test(filename);
            };
          })(filterfn);
        } else if ("function" !== typeof filterfn) {
          return () => true;
        }
        return filterfn;
      }
      const relativePath = (local, entry) => {
        let lastChar = entry.slice(-1);
        lastChar = lastChar === filetools.sep ? filetools.sep : "";
        return pth.relative(local, entry) + lastChar;
      };
      return {
        /**
         * Extracts the given entry from the archive and returns the content as a Buffer object
         * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
         * @param {Buffer|string} [pass] - password
         * @return Buffer or Null in case of error
         */
        readFile: function(entry, pass) {
          var item = getEntry(entry);
          return item && item.getData(pass) || null;
        },
        /**
         * Returns how many child elements has on entry (directories) on files it is always 0
         * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
         * @returns {integer}
         */
        childCount: function(entry) {
          const item = getEntry(entry);
          if (item) {
            return _zip.getChildCount(item);
          }
        },
        /**
         * Asynchronous readFile
         * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
         * @param {callback} callback
         *
         * @return Buffer or Null in case of error
         */
        readFileAsync: function(entry, callback) {
          var item = getEntry(entry);
          if (item) {
            item.getDataAsync(callback);
          } else {
            callback(null, "getEntry failed for:" + entry);
          }
        },
        /**
         * Extracts the given entry from the archive and returns the content as plain text in the given encoding
         * @param {ZipEntry|string} entry - ZipEntry object or String with the full path of the entry
         * @param {string} encoding - Optional. If no encoding is specified utf8 is used
         *
         * @return String
         */
        readAsText: function(entry, encoding) {
          var item = getEntry(entry);
          if (item) {
            var data = item.getData();
            if (data && data.length) {
              return data.toString(encoding || "utf8");
            }
          }
          return "";
        },
        /**
         * Asynchronous readAsText
         * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
         * @param {callback} callback
         * @param {string} [encoding] - Optional. If no encoding is specified utf8 is used
         *
         * @return String
         */
        readAsTextAsync: function(entry, callback, encoding) {
          var item = getEntry(entry);
          if (item) {
            item.getDataAsync(function(data, err) {
              if (err) {
                callback(data, err);
                return;
              }
              if (data && data.length) {
                callback(data.toString(encoding || "utf8"));
              } else {
                callback("");
              }
            });
          } else {
            callback("");
          }
        },
        /**
         * Remove the entry from the file or the entry and all it's nested directories and files if the given entry is a directory
         *
         * @param {ZipEntry|string} entry
         * @param {boolean} withsubfolders
         * @returns {void}
         */
        deleteFile: function(entry, withsubfolders = true) {
          var item = getEntry(entry);
          if (item) {
            _zip.deleteFile(item.entryName, withsubfolders);
          }
        },
        /**
         * Remove the entry from the file or directory without affecting any nested entries
         *
         * @param {ZipEntry|string} entry
         * @returns {void}
         */
        deleteEntry: function(entry) {
          var item = getEntry(entry);
          if (item) {
            _zip.deleteEntry(item.entryName);
          }
        },
        /**
         * Adds a comment to the zip. The zip must be rewritten after adding the comment.
         *
         * @param {string} comment
         */
        addZipComment: function(comment) {
          _zip.comment = comment;
        },
        /**
         * Returns the zip comment
         *
         * @return String
         */
        getZipComment: function() {
          return _zip.comment || "";
        },
        /**
         * Adds a comment to a specified zipEntry. The zip must be rewritten after adding the comment
         * The comment cannot exceed 65535 characters in length
         *
         * @param {ZipEntry} entry
         * @param {string} comment
         */
        addZipEntryComment: function(entry, comment) {
          var item = getEntry(entry);
          if (item) {
            item.comment = comment;
          }
        },
        /**
         * Returns the comment of the specified entry
         *
         * @param {ZipEntry} entry
         * @return String
         */
        getZipEntryComment: function(entry) {
          var item = getEntry(entry);
          if (item) {
            return item.comment || "";
          }
          return "";
        },
        /**
         * Updates the content of an existing entry inside the archive. The zip must be rewritten after updating the content
         *
         * @param {ZipEntry} entry
         * @param {Buffer} content
         */
        updateFile: function(entry, content) {
          var item = getEntry(entry);
          if (item) {
            item.setData(content);
          }
        },
        /**
         * Adds a file from the disk to the archive
         *
         * @param {string} localPath File to add to zip
         * @param {string} [zipPath] Optional path inside the zip
         * @param {string} [zipName] Optional name for the file
         * @param {string} [comment] Optional file comment
         */
        addLocalFile: function(localPath, zipPath, zipName, comment) {
          if (filetools.fs.existsSync(localPath)) {
            zipPath = zipPath ? fixPath(zipPath) : "";
            const p = pth.win32.basename(pth.win32.normalize(localPath));
            zipPath += zipName ? zipName : p;
            const _attr = filetools.fs.statSync(localPath);
            const data = _attr.isFile() ? filetools.fs.readFileSync(localPath) : Buffer.alloc(0);
            if (_attr.isDirectory()) zipPath += filetools.sep;
            this.addFile(zipPath, data, comment, _attr);
          } else {
            throw Utils.Errors.FILE_NOT_FOUND(localPath);
          }
        },
        /**
         * Callback for showing if everything was done.
         *
         * @callback doneCallback
         * @param {Error} err - Error object
         * @param {boolean} done - was request fully completed
         */
        /**
         * Adds a file from the disk to the archive
         *
         * @param {(object|string)} options - options object, if it is string it us used as localPath.
         * @param {string} options.localPath - Local path to the file.
         * @param {string} [options.comment] - Optional file comment.
         * @param {string} [options.zipPath] - Optional path inside the zip
         * @param {string} [options.zipName] - Optional name for the file
         * @param {doneCallback} callback - The callback that handles the response.
         */
        addLocalFileAsync: function(options2, callback) {
          options2 = typeof options2 === "object" ? options2 : { localPath: options2 };
          const localPath = pth.resolve(options2.localPath);
          const { comment } = options2;
          let { zipPath, zipName } = options2;
          const self = this;
          filetools.fs.stat(localPath, function(err, stats) {
            if (err) return callback(err, false);
            zipPath = zipPath ? fixPath(zipPath) : "";
            const p = pth.win32.basename(pth.win32.normalize(localPath));
            zipPath += zipName ? zipName : p;
            if (stats.isFile()) {
              filetools.fs.readFile(localPath, function(err2, data) {
                if (err2) return callback(err2, false);
                self.addFile(zipPath, data, comment, stats);
                return setImmediate(callback, void 0, true);
              });
            } else if (stats.isDirectory()) {
              zipPath += filetools.sep;
              self.addFile(zipPath, Buffer.alloc(0), comment, stats);
              return setImmediate(callback, void 0, true);
            }
          });
        },
        /**
         * Adds a local directory and all its nested files and directories to the archive
         *
         * @param {string} localPath - local path to the folder
         * @param {string} [zipPath] - optional path inside zip
         * @param {(RegExp|function)} [filter] - optional RegExp or Function if files match will be included.
         */
        addLocalFolder: function(localPath, zipPath, filter) {
          filter = filenameFilter(filter);
          zipPath = zipPath ? fixPath(zipPath) : "";
          localPath = pth.normalize(localPath);
          if (filetools.fs.existsSync(localPath)) {
            const items = filetools.findFiles(localPath);
            const self = this;
            if (items.length) {
              for (const filepath of items) {
                const p = pth.join(zipPath, relativePath(localPath, filepath));
                if (filter(p)) {
                  self.addLocalFile(filepath, pth.dirname(p));
                }
              }
            }
          } else {
            throw Utils.Errors.FILE_NOT_FOUND(localPath);
          }
        },
        /**
         * Asynchronous addLocalFolder
         * @param {string} localPath
         * @param {callback} callback
         * @param {string} [zipPath] optional path inside zip
         * @param {RegExp|function} [filter] optional RegExp or Function if files match will
         *               be included.
         */
        addLocalFolderAsync: function(localPath, callback, zipPath, filter) {
          filter = filenameFilter(filter);
          zipPath = zipPath ? fixPath(zipPath) : "";
          localPath = pth.normalize(localPath);
          var self = this;
          filetools.fs.open(localPath, "r", function(err) {
            if (err && err.code === "ENOENT") {
              callback(void 0, Utils.Errors.FILE_NOT_FOUND(localPath));
            } else if (err) {
              callback(void 0, err);
            } else {
              var items = filetools.findFiles(localPath);
              var i = -1;
              var next = function() {
                i += 1;
                if (i < items.length) {
                  var filepath = items[i];
                  var p = relativePath(localPath, filepath).split("\\").join("/");
                  p = p.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");
                  if (filter(p)) {
                    filetools.fs.stat(filepath, function(er0, stats) {
                      if (er0) callback(void 0, er0);
                      if (stats.isFile()) {
                        filetools.fs.readFile(filepath, function(er1, data) {
                          if (er1) {
                            callback(void 0, er1);
                          } else {
                            self.addFile(zipPath + p, data, "", stats);
                            next();
                          }
                        });
                      } else {
                        self.addFile(zipPath + p + "/", Buffer.alloc(0), "", stats);
                        next();
                      }
                    });
                  } else {
                    process.nextTick(() => {
                      next();
                    });
                  }
                } else {
                  callback(true, void 0);
                }
              };
              next();
            }
          });
        },
        /**
         * Adds a local directory and all its nested files and directories to the archive
         *
         * @param {object | string} options - options object, if it is string it us used as localPath.
         * @param {string} options.localPath - Local path to the folder.
         * @param {string} [options.zipPath] - optional path inside zip.
         * @param {RegExp|function} [options.filter] - optional RegExp or Function if files match will be included.
         * @param {function|string} [options.namefix] - optional function to help fix filename
         * @param {doneCallback} callback - The callback that handles the response.
         *
         */
        addLocalFolderAsync2: function(options2, callback) {
          const self = this;
          options2 = typeof options2 === "object" ? options2 : { localPath: options2 };
          const localPath = pth.resolve(options2.localPath);
          let { zipPath, filter, namefix } = options2;
          if (filter instanceof RegExp) {
            filter = /* @__PURE__ */ (function(rx) {
              return function(filename) {
                return rx.test(filename);
              };
            })(filter);
          } else if ("function" !== typeof filter) {
            filter = function() {
              return true;
            };
          }
          zipPath = zipPath ? fixPath(zipPath) : "";
          if (namefix === "latin1") {
            namefix = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");
          }
          if (typeof namefix !== "function") namefix = (str) => str;
          const relPathFix = (entry) => pth.join(zipPath, namefix(relativePath(localPath, entry)));
          const fileNameFix = (entry) => pth.win32.basename(pth.win32.normalize(namefix(entry)));
          filetools.fs.open(localPath, "r", function(err) {
            if (err && err.code === "ENOENT") {
              callback(Utils.Errors.FILE_NOT_FOUND(localPath), false);
            } else if (err) {
              callback(err, false);
            } else {
              filetools.findFilesAsync(localPath, function(err2, fileEntries) {
                if (err2) return callback(err2, false);
                fileEntries = fileEntries.filter((dir) => filter(relPathFix(dir)));
                if (!fileEntries.length) return callback(void 0, true);
                setImmediate(
                  fileEntries.reverse().reduce(function(next, entry) {
                    return function(err3, done) {
                      if (err3 || done === false) return setImmediate(next, err3, false);
                      self.addLocalFileAsync(
                        {
                          localPath: entry,
                          zipPath: pth.dirname(relPathFix(entry)),
                          zipName: fileNameFix(entry)
                        },
                        next
                      );
                    };
                  }, callback)
                );
              });
            }
          });
        },
        /**
         * Adds a local directory and all its nested files and directories to the archive
         *
         * @param {string} localPath - path where files will be extracted
         * @param {object} props - optional properties
         * @param {string} [props.zipPath] - optional path inside zip
         * @param {RegExp|function} [props.filter] - optional RegExp or Function if files match will be included.
         * @param {function|string} [props.namefix] - optional function to help fix filename
         */
        addLocalFolderPromise: function(localPath, props) {
          return new Promise((resolve, reject) => {
            this.addLocalFolderAsync2(Object.assign({ localPath }, props), (err, done) => {
              if (err) return reject(err);
              if (done) resolve(this);
            });
          });
        },
        /**
         * Allows you to create a entry (file or directory) in the zip file.
         * If you want to create a directory the entryName must end in / and a null buffer should be provided.
         * Comment and attributes are optional
         *
         * @param {string} entryName
         * @param {Buffer | string} content - file content as buffer or utf8 coded string
         * @param {string} [comment] - file comment
         * @param {number | object} [attr] - number as unix file permissions, object as filesystem Stats object
         */
        addFile: function(entryName, content, comment, attr) {
          entryName = zipnamefix(entryName);
          let entry = getEntry(entryName);
          const update = entry != null;
          if (!update) {
            entry = new ZipEntry(opts);
            entry.entryName = entryName;
          }
          entry.comment = comment || "";
          const isStat = "object" === typeof attr && attr instanceof filetools.fs.Stats;
          if (isStat) {
            entry.header.time = attr.mtime;
          }
          var fileattr = entry.isDirectory ? 16 : 0;
          let unix = entry.isDirectory ? 16384 : 32768;
          if (isStat) {
            unix |= 4095 & attr.mode;
          } else if ("number" === typeof attr) {
            unix |= 4095 & attr;
          } else {
            unix |= entry.isDirectory ? 493 : 420;
          }
          fileattr = (fileattr | unix << 16) >>> 0;
          entry.attr = fileattr;
          entry.setData(content);
          if (!update) _zip.setEntry(entry);
          return entry;
        },
        /**
         * Returns an array of ZipEntry objects representing the files and folders inside the archive
         *
         * @param {string} [password]
         * @returns Array
         */
        getEntries: function(password) {
          _zip.password = password;
          return _zip ? _zip.entries : [];
        },
        /**
         * Returns a ZipEntry object representing the file or folder specified by ``name``.
         *
         * @param {string} name
         * @return ZipEntry
         */
        getEntry: function(name) {
          return getEntry(name);
        },
        getEntryCount: function() {
          return _zip.getEntryCount();
        },
        forEach: function(callback) {
          return _zip.forEach(callback);
        },
        /**
         * Extracts the given entry to the given targetPath
         * If the entry is a directory inside the archive, the entire directory and it's subdirectories will be extracted
         *
         * @param {string|ZipEntry} entry - ZipEntry object or String with the full path of the entry
         * @param {string} targetPath - Target folder where to write the file
         * @param {boolean} [maintainEntryPath=true] - If maintainEntryPath is true and the entry is inside a folder, the entry folder will be created in targetPath as well. Default is TRUE
         * @param {boolean} [overwrite=false] - If the file already exists at the target path, the file will be overwriten if this is true.
         * @param {boolean} [keepOriginalPermission=false] - The file will be set as the permission from the entry if this is true.
         * @param {string} [outFileName] - String If set will override the filename of the extracted file (Only works if the entry is a file)
         *
         * @return Boolean
         */
        extractEntryTo: function(entry, targetPath, maintainEntryPath, overwrite, keepOriginalPermission, outFileName) {
          overwrite = get_Bool(false, overwrite);
          keepOriginalPermission = get_Bool(false, keepOriginalPermission);
          maintainEntryPath = get_Bool(true, maintainEntryPath);
          outFileName = get_Str(keepOriginalPermission, outFileName);
          var item = getEntry(entry);
          if (!item) {
            throw Utils.Errors.NO_ENTRY();
          }
          var entryName = canonical(item.entryName);
          var target = sanitize(targetPath, outFileName && !item.isDirectory ? canonical(outFileName) : maintainEntryPath ? entryName : pth.basename(entryName));
          if (item.isDirectory) {
            var children = _zip.getEntryChildren(item);
            children.forEach(function(child) {
              if (child.isDirectory) return;
              var content2 = child.getData();
              if (!content2) {
                throw Utils.Errors.CANT_EXTRACT_FILE();
              }
              var name = canonical(maintainEntryPath ? child.entryName : child.entryName.substring(item.entryName.length));
              var childName = sanitize(targetPath, name);
              filetools.assertPathSafe(targetPath, childName);
              const fileAttr2 = keepOriginalPermission ? child.header.fileAttr : void 0;
              filetools.writeFileTo(childName, content2, overwrite, fileAttr2);
            });
            return true;
          }
          var content = item.getData(_zip.password);
          if (!content) throw Utils.Errors.CANT_EXTRACT_FILE();
          filetools.assertPathSafe(targetPath, target);
          if (filetools.fs.existsSync(target) && !overwrite) {
            throw Utils.Errors.CANT_OVERRIDE();
          }
          const fileAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
          filetools.writeFileTo(target, content, overwrite, fileAttr);
          return true;
        },
        /**
         * Test the archive
         * @param {string} [pass]
         */
        test: function(pass) {
          if (!_zip) {
            return false;
          }
          for (var entry of _zip.entries) {
            try {
              if (entry.isDirectory) {
                continue;
              }
              var content = entry.getData(pass);
              if (!content) {
                return false;
              }
            } catch (err) {
              return false;
            }
          }
          return true;
        },
        /**
         * Extracts the entire archive to the given location
         *
         * @param {string} targetPath Target location
         * @param {boolean} [overwrite=false] If the file already exists at the target path, the file will be overwriten if this is true.
         *                  Default is FALSE
         * @param {boolean} [keepOriginalPermission=false] The file will be set as the permission from the entry if this is true.
         *                  Default is FALSE
         * @param {string|Buffer} [pass] password
         */
        extractAllTo: function(targetPath, overwrite, keepOriginalPermission, pass) {
          keepOriginalPermission = get_Bool(false, keepOriginalPermission);
          pass = get_Str(keepOriginalPermission, pass);
          overwrite = get_Bool(false, overwrite);
          if (!_zip) throw Utils.Errors.NO_ZIP();
          const dirEntries = [];
          _zip.entries.forEach(function(entry) {
            var entryName = sanitize(targetPath, canonical(entry.entryName));
            filetools.assertPathSafe(targetPath, entryName);
            if (entry.isDirectory) {
              filetools.makeDir(entryName);
              if (keepOriginalPermission) dirEntries.push({ path: entryName, attr: entry.header.fileAttr });
              return;
            }
            var content = entry.getData(pass);
            if (!content) {
              throw Utils.Errors.CANT_EXTRACT_FILE();
            }
            const fileAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
            filetools.writeFileTo(entryName, content, overwrite, fileAttr);
            try {
              filetools.fs.utimesSync(entryName, entry.header.time, entry.header.time);
            } catch (err) {
            }
          });
          applyDirAttributes(dirEntries);
        },
        /**
         * Asynchronous extractAllTo
         *
         * @param {string} targetPath Target location
         * @param {boolean} [overwrite=false] If the file already exists at the target path, the file will be overwriten if this is true.
         *                  Default is FALSE
         * @param {boolean} [keepOriginalPermission=false] The file will be set as the permission from the entry if this is true.
         *                  Default is FALSE
         * @param {function} callback The callback will be executed when all entries are extracted successfully or any error is thrown.
         */
        extractAllToAsync: function(targetPath, overwrite, keepOriginalPermission, callback) {
          callback = get_Fun(overwrite, keepOriginalPermission, callback);
          keepOriginalPermission = get_Bool(false, keepOriginalPermission);
          overwrite = get_Bool(false, overwrite);
          if (!callback) {
            return new Promise((resolve, reject) => {
              this.extractAllToAsync(targetPath, overwrite, keepOriginalPermission, function(err) {
                if (err) {
                  reject(err);
                } else {
                  resolve(this);
                }
              });
            });
          }
          if (!_zip) {
            callback(Utils.Errors.NO_ZIP());
            return;
          }
          targetPath = pth.resolve(targetPath);
          const getPath = (entry) => sanitize(targetPath, pth.normalize(canonical(entry.entryName)));
          const getError = (msg, file) => new Error(msg + ': "' + file + '"');
          const dirEntries = [];
          const fileEntries = [];
          _zip.entries.forEach((e) => {
            if (e.isDirectory) {
              dirEntries.push(e);
            } else {
              fileEntries.push(e);
            }
          });
          const deferredDirAttr = [];
          for (const entry of dirEntries) {
            const dirPath = getPath(entry);
            const dirAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
            try {
              filetools.assertPathSafe(targetPath, dirPath);
              filetools.makeDir(dirPath);
            } catch (er) {
              callback(getError("Unable to create folder", dirPath));
              continue;
            }
            if (dirAttr) deferredDirAttr.push({ path: dirPath, attr: dirAttr });
            try {
              filetools.fs.utimesSync(dirPath, entry.header.time, entry.header.time);
            } catch (er) {
            }
          }
          const done = (err) => {
            if (!err) {
              try {
                applyDirAttributes(deferredDirAttr);
              } catch (er) {
                return callback(getError("Unable to set folder permissions", er.path || ""));
              }
            }
            callback(err);
          };
          fileEntries.reverse().reduce(function(next, entry) {
            return function(err) {
              if (err) {
                next(err);
              } else {
                const entryName = pth.normalize(canonical(entry.entryName));
                const filePath = sanitize(targetPath, entryName);
                try {
                  filetools.assertPathSafe(targetPath, filePath);
                } catch (er) {
                  return next(er);
                }
                entry.getDataAsync(function(content, err_1) {
                  if (err_1) {
                    next(err_1);
                  } else if (!content) {
                    next(Utils.Errors.CANT_EXTRACT_FILE());
                  } else {
                    const fileAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
                    filetools.writeFileToAsync(filePath, content, overwrite, fileAttr, function(succ) {
                      if (!succ) {
                        return next(getError("Unable to write file", filePath));
                      }
                      filetools.fs.utimes(filePath, entry.header.time, entry.header.time, function() {
                        next();
                      });
                    });
                  }
                });
              }
            };
          }, done)();
        },
        /**
         * Writes the newly created zip file to disk at the specified location or if a zip was opened and no ``targetFileName`` is provided, it will overwrite the opened zip
         *
         * @param {string} targetFileName
         * @param {function} callback
         */
        writeZip: function(targetFileName, callback) {
          if (arguments.length === 1) {
            if (typeof targetFileName === "function") {
              callback = targetFileName;
              targetFileName = "";
            }
          }
          if (!targetFileName && opts.filename) {
            targetFileName = opts.filename;
          }
          if (!targetFileName) return;
          var zipData = _zip.compressToBuffer();
          if (zipData) {
            var ok = filetools.writeFileTo(targetFileName, zipData, true);
            if (typeof callback === "function") callback(!ok ? new Error("failed") : null, "");
          }
        },
        /**
                 *
                 * @param {string} targetFileName
                 * @param {object} [props]
                 * @param {boolean} [props.overwrite=true] If the file already exists at the target path, the file will be overwriten if this is true.
                 * @param {boolean} [props.perm] The file will be set as the permission from the entry if this is true.
        
                 * @returns {Promise<void>}
                 */
        writeZipPromise: function(targetFileName, props) {
          const { overwrite, perm } = Object.assign({ overwrite: true }, props);
          return new Promise((resolve, reject) => {
            if (!targetFileName && opts.filename) targetFileName = opts.filename;
            if (!targetFileName) reject("ADM-ZIP: ZIP File Name Missing");
            this.toBufferPromise().then((zipData) => {
              const ret = (done) => done ? resolve(done) : reject("ADM-ZIP: Wasn't able to write zip file");
              filetools.writeFileToAsync(targetFileName, zipData, overwrite, perm, ret);
            }, reject);
          });
        },
        /**
         * @returns {Promise<Buffer>} A promise to the Buffer.
         */
        toBufferPromise: function() {
          return new Promise((resolve, reject) => {
            _zip.toAsyncBuffer(resolve, reject);
          });
        },
        /**
         * Returns the content of the entire zip file as a Buffer object
         *
         * @prop {function} [onSuccess]
         * @prop {function} [onFail]
         * @prop {function} [onItemStart]
         * @prop {function} [onItemEnd]
         * @returns {Buffer}
         */
        toBuffer: function(onSuccess, onFail, onItemStart, onItemEnd) {
          if (typeof onSuccess === "function") {
            _zip.toAsyncBuffer(onSuccess, onFail, onItemStart, onItemEnd);
            return null;
          }
          return _zip.compressToBuffer();
        }
      };
    };
  }
});

// .tmp-verify/test.ts
var import_promises9 = __toESM(require("node:fs/promises"));
var import_node_path8 = __toESM(require("node:path"));

// src/main/core/installer.ts
var import_promises6 = __toESM(require("node:fs/promises"));
var import_node_path5 = __toESM(require("node:path"));

// src/main/core/mirror.ts
var HOST_MAP = {
  "https://piston-meta.mojang.com": "https://bmclapi2.bangbang93.com",
  "https://piston-data.mojang.com": "https://bmclapi2.bangbang93.com",
  "https://launchermeta.mojang.com": "https://bmclapi2.bangbang93.com",
  "https://launcher.mojang.com": "https://bmclapi2.bangbang93.com",
  "https://libraries.minecraft.net": "https://bmclapi2.bangbang93.com/maven",
  "https://resources.download.minecraft.net": "https://bmclapi2.bangbang93.com/assets"
};
function mirrorUrl(raw) {
  try {
    const u = new URL(raw);
    const base2 = `${u.protocol}//${u.host}`;
    const mapped = HOST_MAP[base2];
    if (!mapped) return raw;
    return `${mapped}${u.pathname}${u.search}`;
  } catch {
    return raw;
  }
}
function candidates(raw, mirror) {
  if (mirror === "official") return [raw];
  const m = mirrorUrl(raw);
  return m === raw ? [raw] : [m, raw];
}
var OFFICIAL_MANIFEST = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
var BMCLAPI_MANIFEST = "https://bmclapi2.bangbang93.com/mc/game/version_manifest_v2.json";
var BMCLAPI_VERSION_JSON = (id) => `https://bmclapi2.bangbang93.com/version/${encodeURIComponent(id)}/json`;

// src/main/core/downloader.ts
var import_node_crypto2 = require("node:crypto");
var import_node_fs2 = require("node:fs");
var import_promises2 = __toESM(require("node:fs/promises"));
var import_node_path2 = __toESM(require("node:path"));
var import_node_stream = require("node:stream");
var import_promises3 = require("node:stream/promises");

// src/main/core/util.ts
var import_node_crypto = require("node:crypto");
var import_node_fs = require("node:fs");
var import_promises = __toESM(require("node:fs/promises"));
var import_node_path = __toESM(require("node:path"));
var import_node_os = __toESM(require("node:os"));
var USER_AGENT = `SCL/1.0.0 (Minecraft Launcher; ${process.platform})`;
function osName() {
  if (process.platform === "win32") return "windows";
  if (process.platform === "darwin") return "osx";
  return "linux";
}
function osArch() {
  switch (process.arch) {
    case "x64":
      return "x86_64";
    case "ia32":
      return "x86";
    case "arm64":
      return "arm64";
    case "arm":
      return "arm32";
    default:
      return process.arch;
  }
}
function osVersion() {
  return import_node_os.default.release();
}
async function ensureDir(dir) {
  await import_promises.default.mkdir(dir, { recursive: true });
}
async function exists(p) {
  try {
    await import_promises.default.access(p);
    return true;
  } catch {
    return false;
  }
}
async function fileSize(p) {
  try {
    const st = await import_promises.default.stat(p);
    return st.isFile() ? st.size : -1;
  } catch {
    return -1;
  }
}
async function sha1File(p) {
  return new Promise((resolve, reject) => {
    const hash = (0, import_node_crypto.createHash)("sha1");
    const stream = (0, import_node_fs.createReadStream)(p);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}
async function readJson(p, fallback) {
  try {
    const raw = await import_promises.default.readFile(p, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
async function writeJsonAtomic(p, data) {
  await ensureDir(import_node_path.default.dirname(p));
  const tmp = `${p}.${process.pid}.tmp`;
  await import_promises.default.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await import_promises.default.rename(tmp, p);
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function anySignal(signals) {
  if (typeof AbortSignal.any === "function") return AbortSignal.any(signals);
  const ctrl = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      ctrl.abort(s.reason);
      break;
    }
    s.addEventListener("abort", () => ctrl.abort(s.reason), { once: true });
  }
  return ctrl.signal;
}
async function fetchJson(url, signal, timeoutMs = 25e3) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: signal ? anySignal([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return await res.json();
}
async function mapLimit(items, limit, fn, signal) {
  const results = new Array(items.length);
  let next = 0;
  const workers = new Array(Math.min(limit, items.length || 1)).fill(0).map(async () => {
    for (; ; ) {
      if (signal?.aborted) throw signal.reason ?? new DOMException("Aborted", "AbortError");
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}
function offlineUuid(name) {
  const hash = (0, import_node_crypto.createHash)("md5").update(`OfflinePlayer:${name}`, "utf8").digest();
  hash[6] = hash[6] & 15 | 48;
  hash[8] = hash[8] & 63 | 128;
  const hex = hash.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
function isAbortError(err) {
  return err instanceof Error && (err.name === "AbortError" || err.message === "aborted" || err.message.includes("aborted"));
}

// src/main/core/downloader.ts
async function downloadOnce(url, task, signal, onBytes) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new Error("\u8FDE\u63A5\u8D85\u65F6")), 2e4);
  let res;
  try {
    res = await fetch(url, {
      signal: signal ? anySignal([signal, ctrl.signal]) : ctrl.signal,
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow"
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok || !res.body) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  await ensureDir(import_node_path2.default.dirname(task.dest));
  const part = `${task.dest}.part`;
  await import_promises2.default.rm(part, { force: true });
  const hash = (0, import_node_crypto2.createHash)("sha1");
  let received = 0;
  const meter = new import_node_stream.Transform({
    transform(chunk, _enc, cb) {
      hash.update(chunk);
      received += chunk.length;
      onBytes(chunk.length);
      cb(null, chunk);
    }
  });
  try {
    await (0, import_promises3.pipeline)(import_node_stream.Readable.fromWeb(res.body), meter, (0, import_node_fs2.createWriteStream)(part));
    if (task.sha1 && hash.digest("hex") !== task.sha1) {
      throw new Error("SHA1 \u6821\u9A8C\u5931\u8D25");
    }
    if (task.size && received !== task.size) {
      throw new Error(`\u6587\u4EF6\u5927\u5C0F\u4E0D\u7B26 (${received}/${task.size})`);
    }
    await import_promises2.default.rename(part, task.dest);
  } catch (err) {
    await import_promises2.default.rm(part, { force: true });
    throw err;
  }
}
async function ensureFile(task, signal, onBytes = () => {
}) {
  const size = await fileSize(task.dest);
  if (size >= 0) {
    const sizeOk = task.size ? size === task.size : true;
    if (sizeOk) {
      if (task.verifyHash && task.sha1) {
        try {
          if (await sha1File(task.dest) === task.sha1) return { downloaded: false, bytes: size };
        } catch {
        }
      } else {
        return { downloaded: false, bytes: size };
      }
    }
  }
  let lastErr = null;
  for (const url of task.urls) {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (signal?.aborted) throw signal.reason ?? new DOMException("Aborted", "AbortError");
      try {
        await downloadOnce(url, task, signal, onBytes);
        return { downloaded: true, bytes: task.size ?? await fileSize(task.dest) ?? 0 };
      } catch (err) {
        if (isAbortError(err) || signal?.aborted) throw err;
        lastErr = err;
        await sleep(400 + attempt * 800);
      }
    }
  }
  throw new Error(`\u4E0B\u8F7D\u5931\u8D25\uFF1A${task.label ?? task.dest} (${lastErr instanceof Error ? lastErr.message : String(lastErr)})`);
}

// src/main/core/version.ts
var import_promises4 = __toESM(require("node:fs/promises"));
var import_node_fs3 = require("node:fs");
var import_node_path3 = __toESM(require("node:path"));
var DEFAULT_FEATURES = {
  is_demo_user: false,
  has_custom_resolution: false,
  has_quick_plays_support: false
};
function ruleApplies(rule, features) {
  if (rule.os) {
    if (rule.os.name && rule.os.name !== osName()) return false;
    if (rule.os.arch && rule.os.arch !== osArch()) return false;
    if (rule.os.version) {
      try {
        if (!new RegExp(rule.os.version).test(osVersion())) return false;
      } catch {
      }
    }
  }
  if (rule.features) {
    for (const [key, want] of Object.entries(rule.features)) {
      if (Boolean(features[key]) !== Boolean(want)) return false;
    }
  }
  return true;
}
function rulesAllow(rules, features = DEFAULT_FEATURES) {
  if (!rules || rules.length === 0) return true;
  let allowed = false;
  for (const rule of rules) {
    if (ruleApplies(rule, features)) allowed = rule.action === "allow";
  }
  return allowed;
}
var NATIVE_RE = /^(natives|natives-|native-)/;
function libraryNameParts(name) {
  const [coordsRaw, extRaw] = name.split("@");
  const parts = coordsRaw.split(":");
  if (parts.length < 3) return null;
  return {
    group: parts[0],
    artifact: parts[1],
    version: parts[2],
    classifier: parts[3] || void 0,
    ext: extRaw || "jar"
  };
}
function mavenPath(name) {
  const p = libraryNameParts(name);
  if (!p) return null;
  const file = `${p.artifact}-${p.version}${p.classifier ? `-${p.classifier}` : ""}.${p.ext}`;
  return `${p.group.replace(/\./g, "/")}/${p.artifact}/${p.version}/${file}`;
}
function libKey(name) {
  const p = libraryNameParts(name);
  return p ? `${p.group}:${p.artifact}${p.classifier ? ":" + p.classifier : ""}` : name;
}
function isNativeLib(lib) {
  const p = libraryNameParts(lib.name);
  return Boolean(p?.classifier && NATIVE_RE.test(p.classifier));
}
function archTokenOf(classifier) {
  const c = classifier.toLowerCase();
  if (/(^|[-_])arm64($|[-_])/.test(c) || c.includes("aarch64")) return "arm64";
  if (c.includes("arm32") || /(^|[-_])arm($|[-_])/.test(c)) return "arm32";
  if (c.includes("x86_64") || c.includes("amd64")) return "x86_64";
  if (c.includes("x86") || /(^|[-_])32($|[-_])/.test(c)) return "x86";
  return null;
}
function nativeScore(classifier) {
  const token = archTokenOf(classifier);
  if (!token) return 5;
  if (token === osArch()) return 10;
  return -1;
}
function collectNatives(libraries, features = DEFAULT_FEATURES) {
  const groups = /* @__PURE__ */ new Map();
  for (const lib of libraries) {
    if (!rulesAllow(lib.rules, features)) continue;
    const p = libraryNameParts(lib.name);
    if (!p) continue;
    let classifier;
    if (lib.natives) {
      const key = lib.natives[osName()];
      if (key) classifier = key.replace("${arch}", osArch() === "x86" ? "32" : "64");
    } else if (p.classifier && NATIVE_RE.test(p.classifier)) {
      classifier = p.classifier;
    }
    if (!classifier) continue;
    const artifact = lib.downloads?.classifiers?.[classifier] ?? (p.classifier === classifier ? lib.downloads?.artifact : void 0);
    if (!artifact?.url) continue;
    const group = `${p.group}:${p.artifact}`;
    const list = groups.get(group) ?? [];
    list.push({ lib, classifier, artifact });
    groups.set(group, list);
  }
  const out = [];
  for (const list of groups.values()) {
    const scored = list.map((s) => ({ s, score: nativeScore(s.classifier) })).filter((x) => x.score >= 0).sort((a, b) => b.score - a.score);
    if (scored.length) out.push(scored[0].s);
  }
  return out;
}
function classifyLoader(json) {
  if (/-puzzle(?:$|-)/i.test(json.id)) return { loader: "puzzle" };
  const libs = json.libraries ?? [];
  const find = (prefix) => libs.find((l) => l.name.startsWith(prefix));
  const fabric = find("net.fabricmc:fabric-loader");
  if (fabric) return { loader: "fabric", loaderVersion: libraryNameParts(fabric.name)?.version };
  const quilt = find("org.quiltmc:quilt-loader");
  if (quilt) return { loader: "quilt", loaderVersion: libraryNameParts(quilt.name)?.version };
  const neo = find("net.neoforged:neoforge");
  if (neo) return { loader: "neoforge", loaderVersion: libraryNameParts(neo.name)?.version };
  const forge = find("net.minecraftforge:forge") ?? find("net.minecraftforge:fmlloader");
  if (forge) return { loader: "forge", loaderVersion: libraryNameParts(forge.name)?.version };
  const optifine = find("optifine:OptiFine");
  if (optifine) return { loader: "optifine", loaderVersion: libraryNameParts(optifine.name)?.version };
  if (/forge/i.test(json.id)) return { loader: "forge" };
  if (/fabric/i.test(json.id)) return { loader: "fabric" };
  return { loader: "vanilla" };
}
function guessGameVersion(id) {
  const fabric = /^fabric-loader-[^-]+-(.+)$/.exec(id);
  if (fabric) return fabric[1];
  const quilt = /^quilt-loader-[^-]+-(.+)$/.exec(id);
  if (quilt) return quilt[1];
  const m = /(\d+\.\d+(?:\.\d+)?)/.exec(id);
  return m ? m[1] : id;
}
function requiredJavaMajor(gameVersion, explicit) {
  if (explicit) return explicit;
  const m = /^(\d+)\.(\d+)(?:\.(\d+))?/.exec(gameVersion);
  if (!m) return 8;
  const major = Number(m[1]);
  const minor = Number(m[2]);
  if (major > 1) return 21;
  if (minor >= 20 && Number(m[3] ?? 0) >= 5) return 21;
  if (minor >= 18) return 17;
  if (minor >= 17) return 16;
  return 8;
}
async function readVersionJson(gameDir2, id) {
  const p = import_node_path3.default.join(gameDir2, "versions", id, `${id}.json`);
  return readJson(p, { id });
}
async function loadVersionChain(gameDir2, id) {
  const chain = [];
  const seen = /* @__PURE__ */ new Set();
  let current = id;
  while (current && !seen.has(current) && chain.length < 12) {
    seen.add(current);
    const json = await readVersionJson(gameDir2, current);
    if (!json || !json.id) throw new Error(`\u7248\u672C ${current} \u7684 JSON \u4E0D\u5B58\u5728\u6216\u5DF2\u635F\u574F`);
    chain.unshift(json);
    current = json.inheritsFrom;
  }
  return chain;
}
function mergeVersions(chain, gameDir2, id) {
  const leaf = chain[chain.length - 1];
  const libs = /* @__PURE__ */ new Map();
  for (const json of chain) {
    for (const lib of json.libraries ?? []) {
      const osVersionRule = lib.rules?.some((r) => r.os?.version);
      const parts = libraryNameParts(lib.name);
      const key = libKey(lib.name) + (osVersionRule && parts ? `@${parts.version}` : "");
      libs.set(key, lib);
    }
  }
  const game = [];
  const jvm = [];
  for (const json of chain) {
    if (json.arguments?.game) game.push(...json.arguments.game);
    if (json.arguments?.jvm) jvm.push(...json.arguments.jvm);
  }
  const downloads = {};
  let mainClass = "";
  let assets = "legacy";
  let assetIndex;
  let logging;
  let javaMajor = 0;
  let type = leaf.type ?? "release";
  let minecraftArguments;
  for (const json of chain) {
    Object.assign(downloads, json.downloads ?? {});
    if (json.mainClass) mainClass = json.mainClass;
    if (json.assets) assets = json.assets;
    if (json.assetIndex) assetIndex = json.assetIndex;
    if (json.logging) logging = json.logging;
    if (json.javaVersion?.majorVersion) javaMajor = json.javaVersion.majorVersion;
    if (json.type) type = json.type;
    if (json.minecraftArguments) minecraftArguments = json.minecraftArguments;
  }
  const rootId = chain[0].id;
  const gameVersion = chain.length > 1 ? rootId : guessGameVersion(rootId);
  let jarId = id;
  for (let i = chain.length - 1; i >= 0; i--) {
    const candidate = import_node_path3.default.join(gameDir2, "versions", chain[i].id, `${chain[i].id}.jar`);
    if ((0, import_node_fs3.existsSync)(candidate)) {
      jarId = chain[i].id;
      break;
    }
  }
  return {
    id,
    type,
    gameVersion,
    mainClass,
    libraries: [...libs.values()],
    arguments: { game, jvm },
    minecraftArguments,
    assetIndex,
    assets,
    logging,
    javaMajor: requiredJavaMajor(gameVersion, javaMajor || void 0),
    downloads,
    versionDir: import_node_path3.default.join(gameDir2, "versions", id),
    jsonPath: import_node_path3.default.join(gameDir2, "versions", id, `${id}.json`),
    chain: chain.map((c) => c.id),
    jarId
  };
}
async function resolveVersion(gameDir2, id) {
  const chain = await loadVersionChain(gameDir2, id);
  return mergeVersions(chain, gameDir2, id);
}
async function scanVersionDir(gameDir2) {
  const dir = import_node_path3.default.join(gameDir2, "versions");
  let entries = [];
  try {
    const dirents = await import_promises4.default.readdir(dir, { withFileTypes: true });
    entries = dirents.filter((d) => d.isDirectory()).map((d) => d.name);
  } catch {
    return [];
  }
  const out = [];
  for (const name of entries) {
    const base2 = import_node_path3.default.join(dir, name);
    let files = [];
    try {
      files = await import_promises4.default.readdir(base2);
    } catch {
      files = [];
    }
    const candidates2 = [
      `${name}.json`,
      "version.json",
      ...files.filter((f) => f.endsWith(".json") && f !== `${name}.json` && f !== "version.json")
    ];
    let parsed = null;
    let lastError = "";
    for (const file of candidates2) {
      try {
        const raw = (await import_promises4.default.readFile(import_node_path3.default.join(base2, file), "utf8")).replace(/^\uFEFF/, "");
        const json = JSON.parse(raw);
        if (!json.id) json.id = name;
        parsed = json;
        break;
      } catch (err) {
        lastError = err.message;
      }
    }
    if (parsed) out.push({ id: name, json: parsed });
    else out.push({ id: name, json: { id: name }, broken: lastError || "\u7F3A\u5C11\u7248\u672C JSON" });
  }
  return out;
}

// src/main/core/manifest.ts
var cache = null;
async function fetchManifest(mirror, signal) {
  if (cache && cache.mirror === mirror && Date.now() - cache.at < 5 * 6e4) return cache.data;
  const urls = mirror === "bmclapi" ? [BMCLAPI_MANIFEST, OFFICIAL_MANIFEST] : [OFFICIAL_MANIFEST];
  let lastErr = null;
  for (const url of urls) {
    try {
      const data = await fetchJson(url, signal, 3e4);
      if (!data?.versions?.length) throw new Error("\u7248\u672C\u5217\u8868\u4E3A\u7A7A");
      cache = { at: Date.now(), mirror, data };
      return data;
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(`\u65E0\u6CD5\u83B7\u53D6 Minecraft \u7248\u672C\u5217\u8868\uFF1A${lastErr instanceof Error ? lastErr.message : String(lastErr)}`);
}
async function fetchRemoteVersions(mirror, signal) {
  const data = await fetchManifest(mirror, signal);
  const map = (v) => ({
    id: v.id,
    type: v.type,
    releaseTime: v.releaseTime,
    url: v.url
  });
  const releases = data.versions.filter((v) => v.type === "release").map(map);
  const snapshots = data.versions.filter((v) => v.type === "snapshot").map(map);
  return { releases, snapshots, latest: data.latest };
}
async function fetchVersionJson(id, mirror, officialUrl, signal) {
  const urls = [];
  if (mirror === "bmclapi") urls.push(BMCLAPI_VERSION_JSON(id));
  if (officialUrl) urls.push(officialUrl);
  if (!urls.length) urls.push(`https://piston-meta.mojang.com/v1/packages/x/${id}.json`);
  let lastErr = null;
  for (const url of urls) {
    try {
      const json = await fetchJson(url, signal, 3e4);
      if (!json?.id) throw new Error("\u7248\u672C JSON \u683C\u5F0F\u9519\u8BEF");
      return json;
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(`\u65E0\u6CD5\u83B7\u53D6\u7248\u672C ${id} \u7684 JSON\uFF1A${lastErr instanceof Error ? lastErr.message : String(lastErr)}`);
}
async function resolveRemoteVersion(id, mirror, signal) {
  const { releases, snapshots } = await fetchRemoteVersions(mirror, signal);
  const found = [...releases, ...snapshots].find((v) => v.id === id);
  if (!found) throw new Error(`\u5B98\u65B9\u7248\u672C\u5217\u8868\u4E2D\u627E\u4E0D\u5230 ${id}`);
  return found;
}

// src/main/core/loaderMeta.ts
var import_promises5 = __toESM(require("node:fs/promises"));
var import_node_path4 = __toESM(require("node:path"));
var META_FILE = "scl-loader.json";
function loaderMetaPath(gameDir2, versionId) {
  return import_node_path4.default.join(gameDir2, "versions", versionId, META_FILE);
}
async function readLoaderMeta(gameDir2, versionId) {
  try {
    const raw = await import_promises5.default.readFile(loaderMetaPath(gameDir2, versionId), "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.loader !== "puzzle") return null;
    return {
      loader: "puzzle",
      gameVersion: typeof parsed.gameVersion === "string" && parsed.gameVersion ? parsed.gameVersion : "1.21.1",
      versionId: typeof parsed.versionId === "string" && parsed.versionId ? parsed.versionId : versionId,
      installedAt: typeof parsed.installedAt === "number" ? parsed.installedAt : 0
    };
  } catch {
    return null;
  }
}
async function writeLoaderMeta(gameDir2, versionId, gameVersion) {
  const meta = {
    loader: "puzzle",
    gameVersion,
    versionId,
    installedAt: Date.now()
  };
  await writeJsonAtomic(loaderMetaPath(gameDir2, versionId), meta);
}

// src/main/core/installer.ts
var PUZZLE_GAME_VERSION = "1.21.1";
var Meter = class {
  constructor(id, emit) {
    this.id = id;
    this.emit = emit;
  }
  id;
  emit;
  totalFiles = 0;
  doneFiles = 0;
  totalBytes = 0;
  doneBytes = 0;
  phase = "prepare";
  label = "\u51C6\u5907\u4E2D";
  lastAt = Date.now();
  lastBytes = 0;
  speed = 0;
  timer = null;
  finished = false;
  setPhase(phase, label) {
    this.phase = phase;
    this.label = label;
    this.flush(true);
  }
  addTotal(bytes) {
    this.totalBytes += Math.max(0, bytes || 0);
    this.totalFiles += 1;
  }
  addDone(bytes) {
    this.doneBytes += Math.max(0, bytes || 0);
    this.doneFiles += 1;
    this.flush();
  }
  get bytesDone() {
    return this.doneBytes;
  }
  get bytesTotal() {
    return this.totalBytes;
  }
  snapshot() {
    return {
      id: this.id,
      phase: this.phase,
      label: this.label,
      current: this.doneFiles,
      total: this.totalFiles,
      bytes: this.doneBytes,
      totalBytes: this.totalBytes,
      speed: this.speed
    };
  }
  flush(force = false) {
    if (this.finished) return;
    const now = Date.now();
    const dt = now - this.lastAt;
    if (dt > 250) {
      const instant = (this.doneBytes - this.lastBytes) * 1e3 / dt;
      this.speed = this.speed ? this.speed * 0.6 + instant * 0.4 : instant;
      this.lastAt = now;
      this.lastBytes = this.doneBytes;
    }
    if (force) {
      this.emit(this.snapshot());
      return;
    }
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.emit(this.snapshot());
    }, 150);
  }
  finish(phase, label, error) {
    this.phase = phase;
    this.label = label;
    this.finished = true;
    if (this.timer) clearTimeout(this.timer);
    this.emit({ ...this.snapshot(), speed: 0, error });
  }
};
async function runQueue(items, meter, signal, concurrency) {
  const seen = /* @__PURE__ */ new Set();
  const unique = items.filter((item) => {
    if (seen.has(item.dest)) return false;
    seen.add(item.dest);
    return true;
  });
  await mapLimit(
    unique,
    concurrency,
    async (item) => {
      if (signal?.aborted) throw signal.reason ?? new DOMException("Aborted", "AbortError");
      const expected = item.size ?? 0;
      let downloaded = 0;
      try {
        await ensureFile(
          { urls: item.urls, dest: item.dest, sha1: item.sha1, size: item.size, verifyHash: item.verifyHash, label: item.label },
          signal,
          (n) => {
            downloaded += n;
            meter.addDone(n);
          }
        );
      } catch (err) {
        if (item.optional) return;
        throw err;
      }
      if (downloaded === 0) meter.addDone(expected);
    },
    signal
  );
}
function libUrls(url, mirror) {
  return candidates(url, mirror);
}
async function installVersion(opts) {
  const { gameDir: gameDir2, mirror, signal, onProgress, onLog, versionId, officialUrl } = opts;
  const meter = new Meter(versionId, onProgress);
  const log = (m, level = "info") => onLog?.(m, level);
  try {
    meter.setPhase("prepare", "\u83B7\u53D6\u7248\u672C\u4FE1\u606F");
    log(`\u5F00\u59CB\u5B89\u88C5 ${versionId}`);
    let url = officialUrl;
    if (!url) {
      try {
        url = (await resolveRemoteVersion(versionId, mirror, signal)).url;
      } catch {
        url = void 0;
      }
    }
    const json = await fetchVersionJson(versionId, mirror, url, signal);
    const versionDir = import_node_path5.default.join(gameDir2, "versions", versionId);
    await ensureDir(versionDir);
    await writeJsonAtomic(import_node_path5.default.join(versionDir, `${versionId}.json`), json);
    const client = json.downloads?.client;
    if (client?.url) {
      meter.setPhase("client", "\u4E0B\u8F7D\u5BA2\u6237\u7AEF");
      meter.addTotal(client.size ?? 0);
      await runQueue(
        [
          {
            dest: import_node_path5.default.join(versionDir, `${versionId}.jar`),
            urls: libUrls(client.url, mirror),
            sha1: client.sha1,
            size: client.size,
            verifyHash: true,
            label: `${versionId}.jar`
          }
        ],
        meter,
        signal,
        1
      );
    }
    meter.setPhase("libraries", "\u4E0B\u8F7D\u4F9D\u8D56\u5E93");
    const libs = json.libraries ?? [];
    const features = { ...DEFAULT_FEATURES };
    const queue = [];
    for (const lib of libs) {
      if (!rulesAllow(lib.rules, features)) continue;
      if (isNativeLib(lib)) continue;
      const artifact = lib.downloads?.artifact ?? (mavenPath(lib.name) ? {
        path: mavenPath(lib.name),
        url: `${(lib.url ?? "https://libraries.minecraft.net/").replace(/\/+$/, "")}/${mavenPath(lib.name)}`
      } : null);
      if (!artifact?.url) continue;
      const rel = artifact.path ?? mavenPath(lib.name) ?? import_node_path5.default.basename(artifact.url);
      queue.push({
        dest: import_node_path5.default.join(gameDir2, "libraries", rel),
        urls: libUrls(artifact.url, mirror),
        sha1: artifact.sha1,
        size: artifact.size,
        verifyHash: true,
        label: rel,
        // 老版本里 jinput-platform 这类库只有 natives 分类器，没有基础 jar
        optional: Boolean(lib.natives && !lib.downloads?.artifact)
      });
    }
    for (const native of collectNatives(libs, features)) {
      const art = native.artifact;
      const rel = art.path ?? mavenPath(native.lib.name) ?? import_node_path5.default.basename(art.url);
      queue.push({
        dest: import_node_path5.default.join(gameDir2, "libraries", rel),
        urls: libUrls(art.url, mirror),
        sha1: art.sha1,
        size: art.size,
        verifyHash: true,
        label: rel
      });
    }
    for (const item of queue) meter.addTotal(item.size ?? 0);
    await runQueue(queue, meter, signal, 8);
    const logFile = json.logging?.client?.file;
    if (logFile?.url) {
      meter.setPhase("libraries", "\u4E0B\u8F7D\u65E5\u5FD7\u914D\u7F6E");
      meter.addTotal(logFile.size ?? 0);
      await runQueue(
        [
          {
            dest: import_node_path5.default.join(gameDir2, "assets", "log_configs", logFile.id),
            urls: libUrls(logFile.url, mirror),
            sha1: logFile.sha1,
            size: logFile.size,
            verifyHash: true,
            label: logFile.id
          }
        ],
        meter,
        signal,
        1
      );
    }
    const indexInfo = json.assetIndex;
    if (!indexInfo?.url) throw new Error("\u7248\u672C JSON \u7F3A\u5C11 assetIndex\uFF0C\u65E0\u6CD5\u4E0B\u8F7D\u6E38\u620F\u8D44\u6E90");
    meter.setPhase("assets", "\u4E0B\u8F7D\u8D44\u6E90\u7D22\u5F15");
    meter.addTotal(indexInfo.size ?? 0);
    const indexDest = import_node_path5.default.join(gameDir2, "assets", "indexes", `${indexInfo.id}.json`);
    await runQueue(
      [
        {
          dest: indexDest,
          urls: libUrls(indexInfo.url, mirror),
          sha1: indexInfo.sha1,
          size: indexInfo.size,
          verifyHash: true,
          label: `${indexInfo.id}.json`
        }
      ],
      meter,
      signal,
      1
    );
    const indexRaw = JSON.parse(await import_promises6.default.readFile(indexDest, "utf8"));
    const objects = Object.entries(indexRaw.objects ?? {});
    meter.setPhase("assets", `\u4E0B\u8F7D\u6E38\u620F\u8D44\u6E90\uFF08${objects.length} \u4E2A\u6587\u4EF6\uFF09`);
    const assetQueue = objects.map(([name, obj]) => ({
      dest: import_node_path5.default.join(gameDir2, "assets", "objects", obj.hash.slice(0, 2), obj.hash),
      urls: candidates(`https://resources.download.minecraft.net/${obj.hash.slice(0, 2)}/${obj.hash}`, mirror),
      sha1: obj.hash,
      size: obj.size,
      verifyHash: false,
      label: name
    }));
    for (const item of assetQueue) meter.addTotal(item.size ?? 0);
    await runQueue(assetQueue, meter, signal, 16);
    if (indexRaw.virtual) {
      const virtDir = import_node_path5.default.join(gameDir2, "assets", "virtual", indexInfo.id ?? versionId);
      meter.setPhase("assets", "\u751F\u6210\u65E7\u7248\u8D44\u6E90\u76EE\u5F55");
      for (const [name, obj] of objects) {
        const src = import_node_path5.default.join(gameDir2, "assets", "objects", obj.hash.slice(0, 2), obj.hash);
        const dest = import_node_path5.default.join(virtDir, name);
        try {
          await import_promises6.default.mkdir(import_node_path5.default.dirname(dest), { recursive: true });
          await import_promises6.default.copyFile(src, dest);
        } catch {
        }
      }
      log(`\u5DF2\u751F\u6210\u65E7\u7248\u8D44\u6E90\u76EE\u5F55 ${virtDir}`);
    }
    meter.finish("done", "\u5B89\u88C5\u5B8C\u6210");
    log(`\u7248\u672C ${versionId} \u5B89\u88C5\u5B8C\u6210`);
  } catch (err) {
    if (isAbortError(err)) {
      meter.finish("cancelled", "\u5DF2\u53D6\u6D88\u5B89\u88C5");
      log("\u5B89\u88C5\u5DF2\u53D6\u6D88", "warn");
      return;
    }
    const message = err instanceof Error ? err.message : String(err);
    meter.finish("error", "\u5B89\u88C5\u5931\u8D25", message);
    log(`\u5B89\u88C5\u5931\u8D25\uFF1A${message}`, "error");
    throw err;
  }
}
async function installPuzzle(opts) {
  const { gameDir: gameDir2, signal, onProgress, onLog } = opts;
  const mc = String(opts.mcVersion ?? "").trim();
  const log = (m, level = "info") => onLog?.(m, level);
  if (mc !== PUZZLE_GAME_VERSION) {
    throw new Error(`Puzzle \u76EE\u524D\u4EC5\u652F\u6301 Minecraft ${PUZZLE_GAME_VERSION}`);
  }
  const id = `${mc}-puzzle`;
  const total = 1;
  let current = 0;
  const emit = (phase, label, error) => {
    onProgress({ id, phase, label, current, total, bytes: 0, totalBytes: 0, speed: 0, error });
  };
  const checkAbort = () => {
    if (signal?.aborted) throw signal.reason ?? new DOMException("Aborted", "AbortError");
  };
  try {
    emit("prepare", `\u68C0\u67E5\u539F\u7248 ${mc}`);
    const vanillaDir = import_node_path5.default.join(gameDir2, "versions", mc);
    const vanillaJsonPath = import_node_path5.default.join(vanillaDir, `${mc}.json`);
    const vanillaJarPath = import_node_path5.default.join(vanillaDir, `${mc}.jar`);
    let needsVanilla = true;
    try {
      await import_promises6.default.access(vanillaJsonPath);
      await import_promises6.default.access(vanillaJarPath);
      needsVanilla = false;
    } catch {
      needsVanilla = true;
    }
    if (needsVanilla) {
      log(`\u5148\u5B89\u88C5\u539F\u7248 ${mc}`);
      await installVersion({ ...opts, versionId: mc });
      checkAbort();
    }
    emit("prepare", "\u521B\u5EFA Puzzle \u7248\u672C");
    const raw = JSON.parse(await import_promises6.default.readFile(vanillaJsonPath, "utf8"));
    raw.id = id;
    delete raw.inheritsFrom;
    const dir = import_node_path5.default.join(gameDir2, "versions", id);
    await ensureDir(dir);
    await writeJsonAtomic(import_node_path5.default.join(dir, `${id}.json`), raw);
    await import_promises6.default.copyFile(vanillaJarPath, import_node_path5.default.join(dir, `${id}.jar`));
    await writeLoaderMeta(gameDir2, id, mc);
    await resolveVersion(gameDir2, id);
    current = total;
    log(`Puzzle \u7248\u672C\u5DF2\u521B\u5EFA\uFF1A${id}`);
    emit("done", `Puzzle ${mc} \u5B89\u88C5\u5B8C\u6210`);
    return id;
  } catch (err) {
    if (isAbortError(err)) {
      emit("cancelled", "\u5DF2\u53D6\u6D88\u5B89\u88C5");
      log("\u5B89\u88C5\u5DF2\u53D6\u6D88", "warn");
      return "";
    }
    const message = err instanceof Error ? err.message : String(err);
    emit("error", "\u5B89\u88C5\u5931\u8D25", message);
    log(`Puzzle \u5B89\u88C5\u5931\u8D25\uFF1A${message}`, "error");
    throw err;
  }
}

// src/main/core/launcher.ts
var import_node_child_process = require("node:child_process");
var import_promises7 = __toESM(require("node:fs/promises"));
var import_node_fs4 = require("node:fs");
var import_node_path6 = __toESM(require("node:path"));
var import_node_os2 = __toESM(require("node:os"));
var import_adm_zip = __toESM(require_adm_zip());

// src/main/core/java.ts
function pickJava(javas, required) {
  const compatible = required <= 8 ? javas.filter((j) => j.major === 8) : javas.filter((j) => j.major >= required);
  if (compatible.length === 0) return null;
  compatible.sort((a, b) => a.major - b.major);
  return compatible.find((j) => j.major === required) ?? compatible[0];
}

// src/main/core/launcher.ts
var APP_VERSION = "1.0.0";
function resolvePuzzleHome(explicit) {
  return explicit || process.env.PUZZLE_HOME || import_node_path6.default.join(import_node_os2.default.homedir(), "Documents", "Puzzle");
}
async function launchPuzzle(opts) {
  const { gameDir: gameDir2, config, account, javas, onLog, onExit, logDir, dataDir, server } = opts;
  const instance = dataDir ?? gameDir2;
  const log = (text, level = "info") => onLog({ source: "launcher", level, text, time: Date.now() });
  const home = resolvePuzzleHome(opts.puzzleHome);
  const wrapper = import_node_path6.default.join(home, "tools", "scl_launch.py");
  if (!(0, import_node_fs4.existsSync)(wrapper)) {
    throw new Error(`\u627E\u4E0D\u5230 Puzzle \u542F\u52A8\u811A\u672C\uFF1A${wrapper}\u3002\u8BF7\u8BBE\u7F6E\u73AF\u5883\u53D8\u91CF PUZZLE_HOME \u6307\u5411 Puzzle \u4ED3\u5E93`);
  }
  await ensureDir(instance);
  let javaPath = "";
  const overrideJava = config.javaOverrides?.[opts.versionId];
  if (overrideJava && (0, import_node_fs4.existsSync)(overrideJava)) {
    javaPath = overrideJava;
  } else if (config.javaPath && (0, import_node_fs4.existsSync)(config.javaPath)) {
    javaPath = config.javaPath;
  } else {
    javaPath = pickJava(javas, 21)?.path ?? "";
  }
  if (!javaPath && opts.ensureJava) {
    log("\u6CA1\u6709\u627E\u5230 Java 21 \u6216\u66F4\u9AD8\u7248\u672C\uFF0C\u6B63\u5728\u81EA\u52A8\u4E0B\u8F7D\u2026");
    try {
      javaPath = await opts.ensureJava(21);
    } catch (err) {
      log(`\u81EA\u52A8\u4E0B\u8F7D Java \u5931\u8D25\uFF0C\u5C06\u4EA4\u7531 Puzzle \u81EA\u884C\u67E5\u627E\uFF1A${err.message}`, "warn");
    }
  }
  const uuid = account.uuid || offlineUuid(account.username);
  const args = [
    wrapper,
    "--root",
    gameDir2,
    "--instance",
    instance,
    "--version-id",
    opts.gameVersion,
    "--username",
    account.username,
    "--uuid",
    uuid,
    "--user-type",
    account.type === "microsoft" ? "msa" : "legacy",
    "--puzzle-home",
    home
  ];
  if (account.type === "microsoft" && account.accessToken) args.push("--token", account.accessToken);
  if (javaPath) args.push("--java", javaPath);
  if (server) {
    const [host, port] = server.split(":");
    args.push("--game-arg", "--server", "--game-arg", host, "--game-arg", "--port", "--game-arg", port || "25565");
  }
  const python = process.env.PUZZLE_PYTHON || "python3";
  const logsRoot = logDir ?? import_node_path6.default.join(import_node_path6.default.dirname(gameDir2), ".scl-logs");
  await ensureDir(logsRoot).catch(() => {
  });
  const safeId = opts.versionId.replace(/[^\w.-]+/g, "_");
  const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
  const logFile = import_node_path6.default.join(logsRoot, `${safeId}-${stamp}.log`);
  const header = [
    `# SCL ${APP_VERSION} \u542F\u52A8\u65E5\u5FD7`,
    `# ${(/* @__PURE__ */ new Date()).toISOString()}`,
    `# puzzle: ${home}`,
    `# \u7248\u672C: ${opts.versionId}\uFF08\u539F\u7248 ${opts.gameVersion}\uFF09`,
    javaPath ? `# java: ${javaPath}` : "# java: \u7531 Puzzle \u81EA\u52A8\u9009\u62E9",
    ""
  ];
  await import_promises7.default.writeFile(logFile, header.join("\n"), "utf8").catch(() => {
  });
  const appendLog = async (text) => {
    await import_promises7.default.appendFile(logFile, text + "\n").catch(() => {
    });
  };
  appendLog([python, ...args].join(" ")).catch(() => {
  });
  log(`\u542F\u52A8 Puzzle ${opts.gameVersion}\uFF08${opts.versionId}\uFF09\uFF0CPuzzle \u4ED3\u5E93\uFF1A${home}`);
  const child = (0, import_node_child_process.spawn)(python, args, {
    cwd: instance,
    env: { ...process.env, PUZZLE_HOME: home },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: false
  });
  const recent = [];
  const record = (source, level, text) => {
    const trimmed = text.replace(/\r$/, "");
    onLog({ source, level, text: trimmed, time: Date.now() });
    recent.push(trimmed);
    if (recent.length > 300) recent.shift();
  };
  child.stdout?.on("data", (buf) => {
    for (const line of buf.toString("utf8").split("\n")) {
      if (line.trim()) record("game", "info", line);
    }
  });
  child.stderr?.on("data", (buf) => {
    for (const line of buf.toString("utf8").split("\n")) {
      if (line.trim()) record("game", "warn", line);
    }
  });
  child.on("error", (err) => {
    record("launcher", "error", `\u542F\u52A8 Puzzle \u8FDB\u7A0B\u5931\u8D25\uFF1A${err.message}`);
  });
  const pid = child.pid ?? -1;
  log(`Puzzle \u8FDB\u7A0B\u5DF2\u542F\u52A8 (PID ${pid})`);
  let done = false;
  const finish = (code) => {
    if (done) return;
    done = true;
    const crash = analyzeCrash(recent, code);
    if (crash) log(crash, "error");
    else if (code === 0) log("\u6E38\u620F\u5DF2\u6B63\u5E38\u9000\u51FA");
    else log(`\u6E38\u620F\u8FDB\u7A0B\u7ED3\u675F\uFF0C\u9000\u51FA\u7801 ${code}`, code === null ? "warn" : "error");
    appendLog(`# exit code: ${code}`).catch(() => {
    });
    onExit?.(code);
  };
  child.on("exit", (code) => finish(code));
  child.on("close", (code) => finish(code));
  return {
    pid,
    logFile,
    command: [python, ...args],
    kill: () => {
      try {
        child.kill("SIGTERM");
      } catch {
      }
    }
  };
}
function analyzeCrash(lines, code) {
  if (code === 0 || code === null) return null;
  const text = lines.join("\n");
  if (/UnsupportedClassVersionError/i.test(text)) return "\u542F\u52A8\u5931\u8D25\uFF1A\u5F53\u524D Java \u7248\u672C\u8FC7\u4F4E\uFF0C\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u6362\u7528\u66F4\u9AD8\u7248\u672C\u7684 Java";
  if (/OutOfMemoryError/i.test(text)) return "\u542F\u52A8\u5931\u8D25\uFF1A\u5185\u5B58\u4E0D\u8DB3\uFF0C\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u8C03\u5927\u6700\u5927\u5185\u5B58\u6216\u5173\u95ED\u5176\u4ED6\u7A0B\u5E8F";
  if (/Could not find or load main class/i.test(text)) return "\u542F\u52A8\u5931\u8D25\uFF1A\u4E3B\u7C7B\u52A0\u8F7D\u5931\u8D25\uFF0C\u7248\u672C\u6587\u4EF6\u53EF\u80FD\u4E0D\u5B8C\u6574";
  if (/Failed to locate library|UnsatisfiedLinkError/i.test(text)) return "\u542F\u52A8\u5931\u8D25\uFF1A\u539F\u751F\u5E93\u52A0\u8F7D\u5931\u8D25\uFF0C\u53EF\u80FD\u662F\u64CD\u4F5C\u7CFB\u7EDF/\u67B6\u6784\u4E0D\u5339\u914D";
  if (/GLFW error|Failed to create window/i.test(text)) return "\u542F\u52A8\u5931\u8D25\uFF1A\u521B\u5EFA\u6E38\u620F\u7A97\u53E3\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u663E\u5361\u9A71\u52A8\u6216\u663E\u793A\u73AF\u5883";
  if (/Missing or unsupported mandatory dependencies/i.test(text)) return "\u542F\u52A8\u5931\u8D25\uFF1A\u7F3A\u5C11\u5FC5\u8981\u7684\u524D\u7F6E\u6A21\u7EC4";
  if (code !== 130 && code !== 143) return `\u6E38\u620F\u5F02\u5E38\u9000\u51FA\uFF08\u9000\u51FA\u7801 ${code}\uFF09\uFF0C\u53EF\u67E5\u770B\u65E5\u5FD7\u9875\u83B7\u53D6\u8BE6\u7EC6\u4FE1\u606F`;
  return null;
}

// src/main/core/config.ts
var import_promises8 = __toESM(require("node:fs/promises"));
var import_node_path7 = __toESM(require("node:path"));
async function listVersions(gameDir2, lastPlayed) {
  const scanned = await scanVersionDir(gameDir2);
  const out = [];
  for (const item of scanned) {
    const id = item.id;
    const json = item.json;
    let loader = "unknown";
    let loaderVersion;
    let broken = item.broken;
    try {
      const classified = classifyLoader(json);
      loader = classified.loader;
      loaderVersion = classified.loaderVersion;
    } catch {
    }
    let gameVersion = json.inheritsFrom ?? guessGameVersion(id);
    const meta = /-puzzle$/i.test(id) ? await readLoaderMeta(gameDir2, id) : null;
    if (meta) {
      loader = meta.loader;
      loaderVersion = void 0;
      gameVersion = meta.gameVersion;
    }
    let javaMajor = json.javaVersion?.majorVersion;
    if (!javaMajor && json.inheritsFrom) {
      const parent = await readVersionJson(gameDir2, json.inheritsFrom);
      javaMajor = parent.javaVersion?.majorVersion;
    }
    const ownJar = import_node_path7.default.join(gameDir2, "versions", id, `${id}.jar`);
    let hasJar = await exists(ownJar);
    if (!hasJar && json.inheritsFrom) {
      hasJar = await exists(import_node_path7.default.join(gameDir2, "versions", json.inheritsFrom, `${json.inheritsFrom}.jar`));
    }
    if (!hasJar && !json.inheritsFrom) {
      try {
        const files = await import_promises8.default.readdir(import_node_path7.default.join(gameDir2, "versions", id));
        hasJar = files.some((f) => f.endsWith(".jar"));
      } catch {
        hasJar = false;
      }
    }
    out.push({
      id,
      type: json.type ?? "release",
      loader,
      loaderVersion,
      gameVersion,
      installed: Boolean(hasJar) && !broken,
      javaMajor: javaMajor ? requiredJavaMajor(gameVersion, javaMajor) : requiredJavaMajor(gameVersion),
      lastPlayed: lastPlayed[id],
      path: import_node_path7.default.join(gameDir2, "versions", id),
      hasJar,
      broken
    });
  }
  out.sort((a, b) => {
    const la = a.lastPlayed ?? 0;
    const lb = b.lastPlayed ?? 0;
    if (la !== lb) return lb - la;
    return b.id.localeCompare(a.id, void 0, { numeric: true });
  });
  return out;
}

// .tmp-verify/test.ts
var base = import_node_path8.default.join(__dirname, "fixture");
var gameDir = import_node_path8.default.join(base, "game");
var puzzleHome = import_node_path8.default.join(base, "puzzle");
async function main() {
  await import_promises9.default.rm(base, { recursive: true, force: true });
  const vanillaDir = import_node_path8.default.join(gameDir, "versions", "1.21.1");
  await import_promises9.default.mkdir(vanillaDir, { recursive: true });
  await import_promises9.default.writeFile(
    import_node_path8.default.join(vanillaDir, "1.21.1.json"),
    JSON.stringify({ id: "1.21.1", type: "release", mainClass: "net.minecraft.client.main.Main", assets: "17", assetIndex: { id: "17", url: "https://example.invalid/17.json" } })
  );
  await import_promises9.default.writeFile(import_node_path8.default.join(vanillaDir, "1.21.1.jar"), "fake-client-jar");
  const phases = [];
  const logs = [];
  const id = await installPuzzle({
    gameDir,
    mirror: "official",
    mcVersion: "1.21.1",
    onProgress: (p) => phases.push(`${p.phase}:${p.label}`),
    onLog: (m) => logs.push(m)
  });
  console.log("INSTALL_ID=" + id);
  console.log("INSTALL_PHASES=" + JSON.stringify(phases));
  console.log("INSTALL_LOGS=" + JSON.stringify(logs));
  const versionDir = import_node_path8.default.join(gameDir, "versions", "1.21.1-puzzle");
  const copied = JSON.parse(await import_promises9.default.readFile(import_node_path8.default.join(versionDir, "1.21.1-puzzle.json"), "utf8"));
  console.log("COPIED_JSON_ID=" + copied.id);
  console.log("COPIED_JAR=" + await import_promises9.default.readFile(import_node_path8.default.join(versionDir, "1.21.1-puzzle.jar"), "utf8"));
  console.log("META=" + JSON.stringify(await readLoaderMeta(gameDir, "1.21.1-puzzle")));
  const versions = await listVersions(gameDir, {});
  const puzzle = versions.find((v) => v.id === "1.21.1-puzzle");
  console.log("LIST_ENTRY=" + JSON.stringify(puzzle));
  const tools = import_node_path8.default.join(puzzleHome, "tools");
  await import_promises9.default.mkdir(tools, { recursive: true });
  await import_promises9.default.writeFile(
    import_node_path8.default.join(tools, "scl_launch.py"),
    '#!/usr/bin/env python3\nimport sys, json\nprint("FAKE-ARGS " + json.dumps(sys.argv[1:]))\nprint("FAKE-STDERR", file=sys.stderr)\nsys.exit(0)\n'
  );
  const lines = [];
  let exitCode;
  const exited = new Promise((resolve) => {
    void launchPuzzle({
      gameDir,
      versionId: "1.21.1-puzzle",
      gameVersion: "1.21.1",
      puzzleHome,
      config: {
        gameDir,
        javaPath: "",
        maxMemory: 2048,
        minMemory: 512,
        jvmArgs: "",
        width: 854,
        height: 480,
        customResolution: false,
        fullscreen: false,
        mirror: "official",
        selectedVersion: "",
        closeOnLaunch: false,
        lastPlayed: {},
        memoryOverrides: {},
        javaOverrides: {},
        msClientId: "",
        language: "zh-CN",
        dynamicWindow: true,
        isolatedVersions: {},
        autoDownloadJava: false,
        theme: "system",
        updateUrl: "",
        tiltStrength: 100,
        gameLanguage: "zh_cn"
      },
      account: { id: "a", username: "Steve", uuid: "0123456789abcdef0123456789abcdef", type: "offline", createdAt: 0 },
      javas: [],
      logDir: import_node_path8.default.join(base, "logs"),
      onLog: (line) => lines.push(`${line.source}/${line.level}:${line.text}`),
      onExit: (code) => {
        exitCode = code;
        resolve();
      }
    }).catch((err) => {
      console.log("LAUNCH_ERROR=" + err.message);
      resolve();
    });
  });
  await Promise.race([exited, new Promise((r) => setTimeout(r, 15e3))]);
  console.log("LAUNCH_EXIT=" + exitCode);
  console.log("LAUNCH_LINES=" + JSON.stringify(lines));
  try {
    await installPuzzle({ gameDir, mirror: "official", mcVersion: "1.20.1", onProgress: () => {
    } });
    console.log("UNSUPPORTED=NOT_REJECTED");
  } catch (err) {
    console.log("UNSUPPORTED=" + err.message);
  }
}
void main().catch((err) => {
  console.error("TEST_FAILED", err);
  process.exit(1);
});

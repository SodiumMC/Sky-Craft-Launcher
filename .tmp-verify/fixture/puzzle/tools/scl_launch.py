#!/usr/bin/env python3
import sys, json
print("FAKE-ARGS " + json.dumps(sys.argv[1:]))
print("FAKE-STDERR", file=sys.stderr)
sys.exit(0)

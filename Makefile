
MAKEFLAGS += --no-builtin-rules

.SUFFIXES:

packages-json =$(wildcard packages/*/package.json)

bootstrap =packages/.bootstrap.stamp
bootstrap: $(bootstrap)
$(bootstrap): node_modules $(packages-json)
	node_modules/.bin/lerna bootstrap
	touch $@

node_modules: package.json
#	npm i -f typescript@next
	npm i -f --local --global-style


clean: \
  clean-antireflection \
  clean-antireflection-default \
  clean-tsc-simple
	find packages -maxdepth 2 -name node_modules -type d | xargs rm -rf
	rm -f packages/.bootstrap.stamp


tsc-antireflection =packages/antireflection/dist/.tsc-stamp
tsc-test-antireflection =packages/antireflection/test/.tsc-stamp
tsc-antireflection-default =packages/antireflection-default/dist/.tsc-stamp
tsc-tsc-simple =packages/tsc-simple/dist/.tsc-stamp
tsc-test-tsc-simple =packages/tsc-simple/test/.tsc-stamp

tsc-antireflection: $(tsc-antireflection)
tsc-test-antireflection: $(tsc-test-antireflection)
tsc-antireflection-default: $(tsc-antireflection-default)
tsc-tsc-simple: $(tsc-tsc-simple)
tsc-test-tsc-simple: $(tsc-test-tsc-simple)

#### antireflection

antireflection-ts-files =packages/antireflection/src/antireflection.ts
antireflection-test-files =$(wildcard packages/antireflection/test-src/*.ts)

$(tsc-antireflection): $(antireflection-ts-files) packages/antireflection/tsconfig.json tsconfig.base.json
	(cd packages/antireflection ; ../../node_modules/.bin/tsc)
	touch $@

$(tsc-test-antireflection): $(tsc-antireflection) $(antireflection-test-files) packages/antireflection/tsconfig.test.json tsconfig.base.json
	(cd packages/antireflection ; ../../node_modules/.bin/tsc -p tsconfig.test.json)
	touch $@

test-antireflection: $(tsc-test-antireflection) $(tsc-tsc-simple)
	(cd packages/antireflection ; ../../node_modules/.bin/mocha -u tdd)

clean-antireflection:
	rm -rf packages/antireflection/dist/* packages/antireflection/test/* $(tsc-antireflection) $(tsc-test-antireflection)

#### antireflection-default

antireflection-default-ts-files =packages/antireflection-default/src/antireflection-default.ts

$(tsc-antireflection-default): $(tsc-antireflection) $(antireflection-default-ts-files) packages/antireflection-default/tsconfig.json tsconfig.base.json
	(cd packages/antireflection-default ; ../../node_modules/.bin/tsc)
	touch $@

clean-antireflection-default:
	rm -rf packages/antireflection-default/dist/* $(tsc-antireflection-default)

#### tsc-simple

tsc-simple-files =packages/tsc-simple/src/tsc-simple.ts
tsc-simple-test-files =$(wildcard packages/tsc-simple/test-src/*.ts)

$(tsc-tsc-simple): $(tsc-simple-files) packages/tsc-simple/tsconfig.json tsconfig.base.json
	(cd packages/tsc-simple ; ../../node_modules/.bin/tsc)
	touch $@

$(tsc-test-tsc-simple): $(tsc-tsc-simple) $(tsc-simple-test-files) packages/tsc-simple/tsconfig.test.json tsconfig.base.json
	(cd packages/tsc-simple ; ../../node_modules/.bin/tsc -p tsconfig.test.json)
	touch $@

test-tsc-simple: $(tsc-test-tsc-simple)
	(cd packages/tsc-simple ; ../../node_modules/.bin/mocha -u tdd -s 2400)

clean-tsc-simple:
	rm -rf packages/tsc-simple/dist/* packages/tsc-simple/test/* $(tsc-tsc-simple) $(tsc-test-tsc-simple)

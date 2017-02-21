
MAKEFLAGS += --no-builtin-rules

.SUFFIXES:

packages-json =$(wildcard packages/*/package.json)

bootstrap =packages/.bootstrap.stamp
bootstrap: $(bootstrap)
$(bootstrap): node_modules $(packages-json)
	node_modules/.bin/lerna bootstrap
	touch $@

node_modules: package.json
	npm i --global-style


clean: \
  clean-antireflection \
  clean-antireflection-default
	find packages -maxdepth 2 -name node_modules -type d | xargs rm -rf
	rm -f packages/.bootstrap.stamp


tsc-antireflection =packages/antireflection/dist/.tsc-stamp
tsc-test-antireflection =packages/antireflection/test/.tsc-stamp
tsc-antireflection-default =packages/antireflection-default/dist/.tsc-stamp
tsc-test-antireflection-default =packages/antireflection-default/test/.tsc-stamp

tsc-antireflection: $(tsc-antireflection)
tsc-test-antireflection: $(tsc-test-antireflection)
tsc-antireflection-default: $(tsc-antireflection-default)
tsc-test-antireflection-default: $(tsc-test-antireflection-default)

#### antireflection

antireflection-ts-files =packages/antireflection/src/antireflection.ts
antireflection-test-files =$(wildcard packages/antireflection/test-src/*.ts)

$(tsc-antireflection): $(antireflection-ts-files) packages/antireflection/tsconfig.json tsconfig.base.json
	(cd packages/antireflection ; ../../node_modules/.bin/tsc)
	touch $@

$(tsc-test-antireflection): $(tsc-antireflection) $(antireflection-test-files) packages/antireflection/tsconfig.test.json tsconfig.base.json
	(cd packages/antireflection ; ../../node_modules/.bin/tsc -p tsconfig.test.json)
	touch $@

test-antireflection: $(tsc-test-antireflection)
	(cd packages/antireflection ; ../../node_modules/.bin/nyc ../../node_modules/.bin/mocha -u tdd)

clean-antireflection:
	rm -rf packages/antireflection/dist/* packages/antireflection/test/* $(tsc-antireflection) $(tsc-test-antireflection)

#### antireflection-default

antireflection-default-ts-files =packages/antireflection-default/src/antireflection-default.ts
antireflection-default-test-files =$(wildcard packages/antireflection-default/test-src/*.ts)

$(tsc-antireflection-default): $(tsc-antireflection) $(antireflection-default-ts-files) packages/antireflection-default/tsconfig.json tsconfig.base.json
	(cd packages/antireflection-default ; ../../node_modules/.bin/tsc)
	touch $@

$(tsc-test-antireflection-default): $(tsc-antireflection-default) $(antireflection-default-test-files) packages/antireflection-default/tsconfig.test.json tsconfig.base.json
	(cd packages/antireflection-default ; ../../node_modules/.bin/tsc -p tsconfig.test.json)
	touch $@

test-antireflection-default: $(tsc-test-antireflection-default)
	(cd packages/antireflection-default ; ../../node_modules/.bin/nyc ../../node_modules/.bin/mocha -u tdd -t 4000)

clean-antireflection-default:
	rm -rf packages/antireflection-default/dist/* packages/antireflection-default/test/* $(tsc-antireflection-default) $(tsc-test-antireflection-default)



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
  clean-ts-test-host
	find packages -maxdepth 2 -name node_modules -type d | xargs rm -rf
	rm packages/.bootstrap.stamp


tsc-antireflection =packages/antireflection/dist/.tsc-stamp
tsc-test-antireflection =packages/antireflection/test/.tsc-stamp
tsc-antireflection-default =packages/antireflection-default/dist/.tsc-stamp
tsc-ts-test-host =packages/ts-test-host/dist/.tsc-stamp

tsc-antireflection: $(tsc-antireflection)
tsc-test-antireflection: $(tsc-test-antireflection)
tsc-antireflection-default: $(tsc-antireflection-default)
tsc-ts-test-host: $(tsc-ts-test-host)

#### antireflection

antireflection-ts-files =packages/antireflection/src/antireflection.ts
antireflection-test-files =$(wildcard packages/antireflection/test.ts/*.ts)

$(tsc-antireflection): $(antireflection-ts-files) packages/antireflection/tsconfig.json tsconfig.base.json
	(cd packages/antireflection ; ../../node_modules/.bin/tsc)
	touch $@

$(tsc-test-antireflection): $(antireflection-test-files) packages/antireflection/tsconfig.test.json tsconfig.base.json
	(cd packages/antireflection ; ../../node_modules/.bin/tsc -p tsconfig.test.json)
	touch $@

test-antireflection: $(tsc-test-antireflection) $(tsc-ts-test-host)
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

#### ts-test-host

ts-test-host-files =packages/ts-test-host/src/ts-test-host.ts

$(tsc-ts-test-host): $(ts-test-host-files) packages/ts-test-host/tsconfig.json tsconfig.base.json
	(cd packages/ts-test-host ; ../../node_modules/.bin/tsc)
	touch $@

clean-ts-test-host:
	rm -rf packages/ts-test-host/dist/* $(tsc-ts-test-host)

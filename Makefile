CWD=`pwd`

test:
	./test/run.sh

example:
	./bin/whiskey --tests "${CWD}/example/test-success.js ${CWD}/example/test-failure.js"

.PHONY: test example

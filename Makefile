CWD=`pwd`

test:
	./test/simple.sh

example:
	./bin/whiskey --tests "${CWD}/example/test-success.js ${CWD}/example/test-failure.js"

.PHONY: test example

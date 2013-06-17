CWD=`pwd`

test:
	${CWD}/test/run.sh

example:
	${CWD}/bin/whiskey --tests "${CWD}/example/test-success.js ${CWD}/example/test-failure.js"

.PHONY: test example

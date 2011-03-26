#!/bin/bash
CWD=`pwd`

${CWD}/bin/whiskey --tests "${CWD}/example/test-success.js"

if [ $? -ne 0 ]; then
    echo "Test should pass but failed."
    exit 1
fi

${CWD}/bin/whiskey --tests "${CWD}/example/test-failure.js"

if [ ! $? -gt 0 ]; then
    echo "Test should fail but it passed"
    exit 1
fi

${CWD}/bin/whiskey --timeout 1000 --tests "${CWD}/example/test-timeout.js"

if [ ! $? -eq 1 ]; then
    echo "Test should time out but it didn't."
    exit 1
fi

${CWD}/bin/whiskey --tests "${CWD}/example/test-setup-and-teardown.js"

if [ $? -ne 0 ]; then
    echo "Test should pass but failed"
    exit 1
fi

${CWD}/bin/whiskey --tests "${CWD}/example/test-inexistent.js"

if [ $? -ne 1 ]; then
    echo "Test should fail but passed"
    exit 1
fi

${CWD}/bin/whiskey --tests "${CWD}/example/test-setup-fail.js"

if [ $? -ne 1 ]; then
    echo "Only a single test should fail (setUp)"
    exit 1
fi

# Test relative path

${CWD}/bin/whiskey --tests "../example/test-success.js"

if [ $? -ne 0 ]; then
    echo "Test should pass but failed."
    exit 1
fi

# Test multiple files
${CWD}/bin/whiskey --tests "${CWD}/example/test-success.js ${CWD}/example/test-failure.js"

if [ ! $? -gt 0 ]; then
    echo "Test should fail but it passed"
    exit 1
fi

exit 0

#!/bin/bash
CWD=`pwd`

${CWD}/bin/whiskey --tests "${CWD}/example/test-success.js"

if [ $? -ne 0 ]; then
    echo "Test should pass but failed."
    exit 1
fi

${CWD}/bin/whiskey --tests "${CWD}/example/test-failure.js"

if [ $? -ne 1 ]; then
    echo "Test should fail but it passed"
    exit 1
fi

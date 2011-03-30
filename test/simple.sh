#!/bin/bash
CWD=`pwd`

"${CWD}/bin/whiskey" --tests "${CWD}/example/test-success.js"

if [ $? -ne 0 ]; then
    echo "Test should pass but failed."
    exit 1
fi

"${CWD}/bin/whiskey" --tests "${CWD}/example/test-failure.js"

if [ ! $? -gt 0 ]; then
    echo "Test should fail but it passed"
    exit 1
fi

"${CWD}/bin/whiskey" --timeout 1000 --tests "${CWD}/example/test-timeout.js"

if [ ! $? -eq 1 ]; then
    echo "Test should time out but it didn't."
    exit 1
fi

"${CWD}/bin/whiskey" --tests "${CWD}/example/test-setup-and-teardown.js"

if [ $? -ne 0 ]; then
    echo "Test should pass but failed"
    exit 1
fi

# Test file does not exist
"${CWD}/bin/whiskey" --tests "${CWD}/example/test-inexistent.js"

if [ $? -ne 1 ]; then
    echo "Test should fail but passed"
    exit 1
fi

"${CWD}/bin/whiskey" --tests "${CWD}/example/test-setup-fail.js"

if [ $? -ne 1 ]; then
    echo "Only a single test should fail (setUp)"
    exit 1
fi

# Test relative path
"${CWD}/bin/whiskey" --tests "../example/test-success.js"

if [ $? -ne 0 ]; then
    echo "Test should pass but failed."
    exit 1
fi

# Test multiple files
"${CWD}/bin/whiskey" --tests "${CWD}/example/test-success.js ${CWD}/example/test-failure.js"

if [ ! $? -gt 0 ]; then
    echo "Test should fail but it passed"
    exit 1
fi

# Test init file
FOLDER_EXISTS=0
rm -rf ${CWD}/example/test-123456

"${CWD}/bin/whiskey" --init-file "${CWD}/example/init.js" --tests "${CWD}/example/test-success.js"

if [ -d ${CWD}/example/test-123456 ]; then
  FOLDER_EXISTS=1
fi

rm -rf ${CWD}/example/test-123456

if [ $? -ne 0 ] || [ ${FOLDER_EXISTS} -ne 1 ]; then
    echo "Test should pass but failed."
    exit 1
fi

# test uncaught exceptions
"${CWD}/bin/whiskey" --tests "${CWD}/example/test-uncaught.js"

if [ $? -ne 5 ]; then
    echo "Test should fail but passed."
    exit 1
fi

# Test chdir
"${CWD}/bin/whiskey" --tests "${CWD}/example/test-chdir.js"

if [ $? -ne 1 ]; then
    echo "Test should fail but passed."
    exit 1
fi

"${CWD}/bin/whiskey" --tests "${CWD}/example/test-chdir.js" --chdir "${CWD}/example/"

if [ $? -ne 0 ]; then
    echo "Test should pass but failed."
    exit 1
fi

# Test per test init function
"${CWD}/bin/whiskey" --test-init-file "${CWD}/example/init-test.js" --tests "${CWD}/example/test-init-function.js ${CWD}/example/test-init-function.js" --chdir "${CWD}/example/"

if [ $? -ne 0 ]; then
    echo "Test should pass but failed."
    exit 1
fi

# Second test should fail because in this case init function is called only once
"${CWD}/bin/whiskey" --init-file "${CWD}/example/init-test.js" --tests "${CWD}/example/test-init-function.js ${CWD}/example/test-init-function.js" --chdir "${CWD}/example/"

if [ $? -ne 1 ]; then
    echo "Test should fail but passed."
    exit 1
fi

# Test init function timeout (init function is not called)
"${CWD}/bin/whiskey" --timeout 2000 --test-init-file "${CWD}/example/init-timeout.js" --tests "${CWD}/example/test-failure.js" --chdir "${CWD}/example/"

if [ $? -ne 1 ]; then
    echo "Test should fail but passed."
    exit 1
fi

# Test setUp function timeout (setUp function is not called)
"${CWD}/bin/whiskey" --timeout 2000 --tests "${CWD}/example/test-setup-timeout.js" --chdir "${CWD}/example/"

if [ $? -ne 1 ]; then
    echo "Test should fail but passed."
    exit 1
fi

# Test tearDown function timeout (tearDown function is not called)
"${CWD}/bin/whiskey" --timeout 2000 --tests "${CWD}/example/test-teardown-timeout.js" --chdir "${CWD}/example/"

if [ $? -ne 2 ]; then
    echo "Test should fail but passed."
    exit 1
fi
exit 0

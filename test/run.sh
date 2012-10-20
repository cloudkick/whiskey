#!/usr/bin/env bash
CWD=`dirname $0`
CWD=`cd "$APP_DIR";pwd`
W="${CWD}/bin/whiskey"
E="${CWD}/example"
ANY_SUITE="--tests $E/test-skipped.js"

$W -g ./example/global-setup.js ${ANY_SUITE} >/tmp/output 2>&1
if [ $? -ne 0 ]; then
    echo "-g/--global-setup-teardown must base its paths from the invoking CWD"
    exit 1
fi

$W --tests $E/global-teardown.js >/tmp/output 2>&1
if [ $? -ne 0 ]; then
    echo "A test suite without any tests should not break Whiskey."
    exit 1
fi
grep "globalTearDown was here" /tmp/output >/dev/null 2>&1
if [ $? -ne 1 ]; then
    echo "Expected globalTearDown to be ignored."
    exit 1
fi

$W --tests $E/global-setup.js >/tmp/output 2>&1
if [ $? -ne 0 ]; then
    echo "A test suite without any tests should not break Whiskey."
    exit 1
fi
grep "globalSetUp was here" /tmp/output >/dev/null 2>&1
if [ $? -ne 1 ]; then
    echo "Expected globalSetUp to be ignored."
    exit 1
fi

$W -g $E/local-teardown.js ${ANY_SUITE} >/tmp/output 2>&1
if [ $? -ne 0 ]; then
    echo "A file with a 'localTearDown' procedure should not kill Whiskey"
    exit 1
fi
grep "globalTearDown was here" /tmp/output >/dev/null 2>&1
if [ $? -ne 1 ]; then
    echo "Expected localTearDown to have been ignored."
    exit 1
fi

$W -g $E/global-teardown-with-exception.js ${ANY_SUITE} >/tmp/output 2>&1
if [ $? -ne 0 ]; then
    echo "Exceptions raised in globalTearDown should not kill Whiskey run."
    exit 1
fi

$W -g $E/global-teardown.js ${ANY_SUITE} >/tmp/output 2>&1
if [ $? -ne 0 ]; then
    echo "Expected invokation of global teardown to not harm Whiskey."
    exit 1
fi
grep "globalTearDown was here" /tmp/output >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Expected globalTearDown to have been invoked."
    exit 1
fi

$W -g $E/global-setup-with-failed-assertion.js ${ANY_SUITE}
if [ $? -eq 0 ]; then
    echo "An assertion failure inside a global setup procedure should cause a test failure."
    exit 1
fi

$W -g $E/global-setup-with-exception.js ${ANY_SUITE}
if [ $? -eq 0 ]; then
    echo "An exception inside a global setup procedure should cause a test failure."
    exit 1
fi

$W -g $E/local-setup.js ${ANY_SUITE} >/tmp/output 2>&1
if [ $? -ne 0 ]; then
    echo "Expected invokation of global setup to not harm Whiskey."
    exit 1
fi
grep "globalSetUp was here" /tmp/output >/dev/null 2>&1
if [ $? -ne 1 ]; then
    echo "Expected localSetUp to have been ignored."
    exit 1
fi

$W -g $E/global-setup.js ${ANY_SUITE} >/tmp/output 2>&1
if [ $? -ne 0 ]; then
    echo "Expected invokation of global setup to not harm Whiskey."
    exit 1
fi
grep "globalSetUp was here" /tmp/output >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Expected globalSetUp to have been invoked."
    exit 1
fi

$W -g ${ANY_SUITE}
if [ $? -eq 0 ]; then
    echo "Missing parameter should cause whiskey to fail."
    exit 1
fi

$W --global-setup-teardown ${ANY_SUITE}
if [ $? -eq 0 ]; then
    echo "Missing parameter should cause whiskey to fail."
    exit 1
fi

$W -g $E/empty-global-setup-teardown.js ${ANY_SUITE}
if [ $? -ne 0 ]; then
    echo "An empty global setup/teardown file should be syntactically correct."
    echo "Also, a file used as such, but which doesn't export the appropriate"
    echo "procedures (globalSetUp or globalTearDown) should behave the same way."
    exit 1
fi

$W --global-setup-teardown $E/empty-global-setup-teardown.js ${ANY_SUITE}
if [ $? -ne 0 ]; then
    echo "An empty global setup/teardown file should be syntactically correct."
    echo "Also, a file used as such, but which doesn't export the appropriate"
    echo "procedures (globalSetUp or globalTearDown) should behave the same way."
    exit 1
fi

$W -g $E/malformed-javascript-source.js ${ANY_SUITE}
if [ $? -eq 0 ]; then
    echo "A malformed source should cause Whiskey to die early."
    exit 1
fi

START=$(date +%s)
$W -m 2 --independent-tests "$E/test-long-running-1.js $E/test-long-running-2.js"
if [ $? -ne 0 ]; then
    echo "long-running tests should pass"
    exit 1
fi
END=$(date +%s)
DIFF=$(( $END - $START ))
if [ $DIFF -ge 7 ]; then
    echo "Total test execution time should be less than 6 seconds (assuming code hasn't been changed.)"
    exit 1
fi

$W --independent-tests "$E/test-long-running-1.js $E/test-long-running-2.js $E/test-failure.js"
if [ $? -ne 2 ]; then
    echo "2 tests should fail when running tests independently."
    exit 1
fi

$W --tests "$E/test-success.js"

if [ $? -ne 0 ]; then
    echo "tests should pass"
    exit 1
fi

$W --tests "$E/test-failure.js"

if [ $? -ne 2 ]; then
    echo "2 tests should fail"
    exit 1
fi

$W --failfast --timeout 500 \
  --tests --concurrency 100 "$E/test-failure.js $E/test-timeout.js"

if [ $? -ne 1 ]; then
    echo "1 test should fail"
    exit 1
fi

$W --failfast --timeout 500 \
  --tests "$E/test-timeout.js $E/test-failure.js $E/test-timeout.js"

if [ $? -ne 1 ]; then
    echo "1 test should fail"
    exit 1
fi

$W --timeout 1000 --tests "$E/test-timeout.js"

if [ ! $? -eq 1 ]; then
    echo "test should time out"
    exit 1
fi

$W --timeout 1000 --tests "$E/test-timeout-blocking.js"

if [ ! $? -eq 1 ]; then
    echo "test should time out"
    exit 1
fi

$W --tests "$E/test-setup-and-teardown.js"

if [ $? -ne 0 ]; then
    echo "test should pass"
    exit 1
fi

# Test file does not exist
$W --tests "$E/test-inexistent.js"

if [ $? -ne 1 ]; then
    echo "1 test should fail"
    exit 1
fi

$W --tests "$E/test-setup-fail.js"

if [ $? -ne 3 ]; then
    echo "3 tests should fail"
    exit 1
fi

# Test relative path
$W --tests "example/test-success.js"

if [ $? -ne 0 ]; then
    echo "tests should pass."
    exit 1
fi

# Test multiple files
$W --tests "$E/test-success.js $E/test-failure.js"

if [ ! $? -gt 0 ]; then
    echo "2 tests should fail"
    exit 1
fi

# Test test init file
FOLDER_EXISTS=0
rm -rf $E/test-123456

$W --test-init-file "$E/init.js" --tests "$E/test-success.js"

if [ -d $E/test-123456 ]; then
  FOLDER_EXISTS=1
fi

rm -rf $E/test-123456

if [ $? -ne 0 ] || [ ${FOLDER_EXISTS} -ne 1 ]; then
  echo ${FOLDER_EXISTS}
    echo "test should pass m"
    exit 1
fi

# test uncaught exceptions
$W --tests "$E/test-uncaught.js"

if [ $? -ne 5 ]; then
    echo "5 tests should fail"
    exit 1
fi

# Test chdir
$W --tests "$E/test-chdir.js"

if [ $? -ne 1 ]; then
    echo "1 test should fail"
    exit 1
fi

$W --tests "$E/test-chdir.js" --chdir "$E/"

if [ $? -ne 0 ]; then
    echo "tests should pass y"
    exit 1
fi

# Test per test init function
$W --test-init-file "$E/init-test.js" --tests "$E/test-init-function.js"

if [ $? -ne 0 ]; then
    echo "tests should pass x"
    exit 1
fi

# Test init function timeout (callback in init function is not called)
$W --timeout 2000 --test-init-file "$E/init-timeout.js" --tests "$E/test-failure.js"

if [ $? -ne 1 ]; then
    echo "1 test should fail (callback in init function is not called)"
    exit 1
fi

# Test setUp function timeout (setUp function .finish() is not called)
$W --timeout 1000 --tests "$E/test-setup-timeout.js" --chdir "$E/"

if [ $? -ne 1 ]; then
  echo "1 test should fail (setUp timeout)"
    exit 1
fi

# Test tearDown function timeout (tearDown function .finish() is not called)
$W --timeout 2000 --tests "$E/test-teardown-timeout.js" --chdir "$E/"

if [ $? -ne 2 ]; then
    echo "1 test should fail (tearDown timeout)"
    exit 1
fi

$W --timeout 2000 --tests "$E/test-custom-assert-functions.js"

if [ $? -ne 2 ]; then
    echo "2 tests should fail"
    exit 1
fi

$W --timeout 2000 \
 --tests "$E/test-custom-assert-functions.js" \
 --custom-assert-module "$E/custom-assert-functions.js"

if [ $? -ne 1 ]; then
    echo "1 test should fail"
    exit 1
fi

"$E/test-stdout-and-stderr-is-captured-on-timeout.js"

if [ $? -ne 0 ]; then
    echo "test file stdout and stderr was not properly captured during test timeout"
    exit 1
fi

# Verify that when a test file timeout the tests which haven't time out are
# reported properly
"$E/test-succeeded-tests-are-reported-on-timeout.js"

if [ $? -ne 0 ]; then
    echo "succeeded tests were not reported properly upon a test file timeout"
    exit 1
fi

# Verify that coverage works properly
if [ "$(which jscoverage)" ]; then
  "$E/test-jscoverage.js"

  if [ $? -ne 0 ]; then
      echo "coverage does not work properly"
      exit 1
  fi
else
  echo 'jscoverage not installed, skipping coverage tests'
fi

# Make sure that the child which blocks after call .finish() is killed and
# timeout properly reported
$W --timeout 1000 \
 --tests "$E/test-timeout-after-finish.js"

if [ $? -ne 1 ]; then
    echo "1 test should timeout"
    exit 1
fi

# Scope leaks test (sequential and parallel mode)
"$E/test-leaks.js"

if [ $? -ne 0 ]; then
    echo "scope leaks were not reported properly"
    exit 1
fi

# No test function is exported, it should quit immediately
$W --timeout 1000 \
 --tests "$E/test-no-test-functions.js"

if [ $? -ne 0 ]; then
    echo "test didn't exit with zero exit code"
    exit 1
fi

$W --timeout 1000 \
 --tests "$E/test-skipped.js"

if [ $? -ne 0 ]; then
    echo "test didn't exit with zero exit code"
    exit 1
fi

$W --timeout 1000 \
 --tests "$E/test-custom-assert-methods.js"

if [ $? -ne 0 ]; then
    echo "test didn't exit with zero exit code"
    exit 1
fi

# Test pattern name matching
$W --timeout 1000 \
 --tests "example.test-failure.test_one_is_not*"

if [ $? -ne 1 ]; then
    echo "test didn't exit with 1 exit code"
    exit 1
fi

$W --timeout 1000 \
 --tests "$E/test-getFilePathAndPattern.js"

if [ $? -ne 0 ]; then
    echo "test didn't exit with zero exit code"
    exit 1
fi

$W --timeout 1000 \
 --tests "$E/test-spyon.js"

if [ $? -ne 0 ]; then
    echo "Test didn't exit with zero exit code."
    exit 1
fi

$W --timeout 1000 \
--tests "$E/test-bdd.js"

if [ $? -ne 0 ]; then
    echo "BDD test didn't exit with zero exit code."
    exit 1
fi

$W --timeout 1000 \
--tests "$E/test-bdd-failures.js"

if [ $? -ne 4 ]; then
    echo "BDD failure test didn't fail as expected."
    exit 1
fi


echo ""
echo "* * * Whiskey test suite PASSED. * * *"
exit 0

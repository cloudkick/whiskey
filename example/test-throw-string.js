exports['test_throw_string1'] = function(test, assert) {
  throw 'fooo';
};

exports['test_throw_string2'] = function(test, assert) {
  throw new String('string2');
};

const os = require('os');

if (typeof os.cpus === 'function') {
  os.cpus = () => [{}, {}, {}];
}

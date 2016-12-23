# cabot-db-config

Automate your configuration of Cabot monitoring.

[Cabot](http://cabotapp.com/) is a self-hosted monitoring and alert service. But unfortunately it lacks an HTTP API to automate configuration.

cabot-db-config uses a Javascript object to insert your configuration directly on your Cabot database.

Cabot let's you create multiple services, instances and checks. cabot-db-config currently supports a configuration that creates N services, each one running on N instances, and with N checks. A default ping check is created for every newly created instance.

[cabot-db-config](https://www.npmjs.com/package/cabot-db-config) is the spiritual sequel to [cabot-zombie](https://www.npmjs.com/package/cabot-zombie). It is way faster and more reliable.

## Install

```
npm i -S cabot-db-config
```

## Configure

createServices.js
```
const cabotDbConfig = require('cabot-db-config')
const config = require('./config')

cabotDbConfig(config)
```

config.js
```
module.exports = {
  connectionString: 'postgres://docker:docker@my-host:1234/docker',
  data: {
    services: [
      {
        name: 'my-service',
        instances: [
          {
            address: 'my-host',
            checks: [
              {
                type: 'http',
                endpoint: 'http://my-host/index.html',
                text_match: 'Should contain this text',
              },
            ],
          },
          {
            address: 'my-other-host',
            ...
          },
        ],
      },
      {
        name: 'my-other-service',
        instances: [
          ...
        ],
      },
    ],
  },
}
```

## Contributing

cabot-db-config fits perfectly the configuration that I want to do, but it isn't very generic.

Any pull requests in that sense would be greatly appreciated.

## License

MIT

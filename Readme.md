## Quick start

**Install**
```
yarn add aws-request-signer
```

**Add to the project**
```
const Signer = require('aws-request-signer')
```

**Sign the request**
```
const request = new Signer({
        region,
        accessKeyId,
        secretAccessKey
    }, {
        url,
        method,
        dataType: 'json',
        contentType: 'application/x-amz-json-1.0',
        body
    })
```

**Send the request**
```
await fetch('https://' + url.host + url.pathname, request)
```
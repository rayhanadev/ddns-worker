# Cloudflare Dynamic DNS Worker

A deployable Cloudflare Worker to handle Dynamic DNS.

## Usage

Ensure you have the `wrangler` CLI installed and are logged in.

```sh
git clone git://github.com/rayhanadev/ddns-worker.git
cd ddns-worker
bun install
bun run deploy
```

Add the following secrets to your Cloudflare account:

```env
INTERNAL_BASIC_AUTH_USERNAME=
INTERNAL_BASIC_AUTH_PASSWORD=
CLOUDFLARE_API_KEY=
CLOUDFLARE_AUTH_EMAIL=
CLOUDFLARE_ZONE_ID=
CLOUDFLARE_DNS_RECORD_ID=
```

Configure your router use the following URL for updates:

```txt
https://[USERNAME]:[PASSWORD]@ddns-worker.<account_name>.workers.dev/?myip=[MYIP]&hostname=[HOSTNAME]
```

And you should have Dynamic DNS set up on your router!

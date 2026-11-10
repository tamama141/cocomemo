# Retained module provenance

These six non-configuration modules were recovered from retained Site source
`f920dcb75825f2ec4bb20a63297d483c4aad8d2c`. Each file matched the SHA256 recorded
for the earlier `532900712b346a0234545d5fbe2e781386f31f19` configured delivery.
Only reusable code was copied. No Site identity, real configuration, Firebase
values, private reports or credentials are included.

The legacy controller and executable real-entry bootstrap are not loaded here.
The product draft service supplies its own database name, environment and subject
separation; old draft data and the prior confirmation entry remain untouched.
The old memory-auth runtime is not the product auth configuration. Real auth
persistence is prepared separately in `auth-runtime.mjs` and requires later
integration and verification. Retained verification does not certify the new UI
or full-book synchronization.

#!/bin/bash
cd /Users/ctel/source/repos/budge-it
serve -s app/dist -l 3000 --ssl-cert certs/cert.pem --ssl-key certs/key.pem

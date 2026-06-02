#!/bin/bash
cd /Users/ctel/source/repos/budge-it
serve -s app-v2/dist -l tcp://localhost:3000 --ssl-cert certs/cert.pem --ssl-key certs/key.pem

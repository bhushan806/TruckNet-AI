@echo off
mkdir C:\data\db_custom 2>nul
echo Starting MongoDB with Replica Set rs0...
"C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath C:\data\db_custom --port 27017 --replSet rs0 --bind_ip 127.0.0.1

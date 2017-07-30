
#### Copy paste commands
The docker container was built for my workshops, contains embark, testrpc and git.
```
docker run -it -p 127.0.0.1:8000:8000 -p 127.0.0.1:8545:8545 --name adahoy -v D:/e_adahoy:/dapps buben42/workshop bash
docker exec -it adahoy bash
```

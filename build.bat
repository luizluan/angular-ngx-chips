rmdir /S /Q dist

call npm i
call npm run build

cd dist
git add -A
git commit -m 'deploy'
git push -f https://github.com/luizluan/angular-ngx-chips.git master
cd ..


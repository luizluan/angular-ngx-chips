rmdir /S /Q dist

call npm i
call npm run build

cd dist
rmdir /S /Q ".git"
git init
git add -A
git commit -m 'deploy'
git push -f https://github.com/luizluan/angular-ngx-chips.git npm
cd ..


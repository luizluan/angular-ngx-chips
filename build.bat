@echo off

rem Remove the 'dist' directory (if it exists)
rmdir /S /Q dist

rem Install npm dependencies
call npm i

rem Run the build command
call npm run build

rem Enter the 'dist' directory
cd dist

rem Delete the '.git' folder in the 'dist' directory (if it exists)
rmdir /S /Q ".git"

rem Initialize a Git repository in the 'dist' directory
git init

rem Add all files and folders to the Git repository
git add -A

rem Commit the changes
git commit -m "deploy"

rem Configure the "origin" remote repository with the GitHub URL
git remote add origin https://github.com/luizluan/angular-ngx-chips.git

rem Push to the "npm" branch in the "origin" remote repository
git push -f origin npm

rem Navigate back to the previous directory
cd ..

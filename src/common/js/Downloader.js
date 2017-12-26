//文本内容  
var tasksStr = '';

/* 
 * 从数据库查询数据,写入到指定目录下文件中 
 * */
function exportDataFromDb() {
  selectDataFromConcernsDeviceInfos('admin', function(result) {
    if (result.length != 0) {
      for (var i = 0; i < result.length; i++) {
        tasksStr = tasksStr + JSON.stringify(result[i]);
      }
      console.log(tasksStr);
      createAndWriteFile();
    } else {
      console.log('no data');
    }
  });
}

/* 
 * 打开或创建文件夹,创建文件并写入内容 
 * Android:sdcard/xbrother/assets目录 
 * IOS:cdvfile://localhost/persistent/xbrother/assets目录 
 * 文件目录存在则打开,不存在则创建 
 * */
function createAndWriteFile() {
  window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {
    console.log('打开的文件系统: ' + fs.name);
    fs.root.getDirectory('xbrother', { create: true }, function(dirEntry) {
      dirEntry.getDirectory('assets', { create: true }, function(subDirEntry) {
        subDirEntry.getFile("task.json", { create: true, exclusive: false }, function(fileEntry) {
          fileEntry.name == 'task.json';
          fileEntry.fullPath == 'xbrother/assets/task.json';
          //文件内容  
          var dataObj = new Blob([tasksStr], { type: 'text/plain' });
          //写入文件  
          writeFile(fileEntry, dataObj);
        }, onErrorCreateFile);
      }, onErrorGetDir);
    }, onErrorGetDir);
  }, onErrorLoadFs);
}

/* 
 * 依次打开指定目录文件夹,读取文件内容 
 * Android:sdcard/xbrother/assets/task.json 
 * IOS:cdvfile://localhost/persistent/xbrother/assets/task.json 
 * 目录和文件存在则打开,不存在则退出 
 * */
function getAndReadFile() {
  window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {
    console.log('打开的文件系统: ' + fs.name);
    fs.root.getDirectory('xbrother', { create: false }, function(dirEntry) {
      dirEntry.getDirectory('assets', { create: false }, function(subDirEntry) {
        subDirEntry.getFile("task.json", { create: false, exclusive: false }, function(fileEntry) {
          console.log("是否是个文件？" + fileEntry.isFile.toString());
          fileEntry.name == 'task.json';
          fileEntry.fullPath == 'xbrother/assets/task.json';
          readFile(fileEntry);
        }, onErrorCreateFile);
      }, onErrorGetDir);
    }, onErrorGetDir);
  }, onErrorLoadFs);
}

//将内容数据写入到文件中  
function writeFile(fileEntry, dataObj) {
  //创建一个写入对象  
  fileEntry.createWriter(function(fileWriter) {

    //文件写入成功  
    fileWriter.onwriteend = function() {
      console.log("Successful file write...");
    };

    //文件写入失败  
    fileWriter.onerror = function(e) {
      console.log("Failed file write: " + e.toString());
    };

    //写入文件  
    fileWriter.write(dataObj);
  });
}

//读取文件  
function readFile(fileEntry) {
  fileEntry.file(function(file) {
    var reader = new FileReader();
    reader.onloadend = function() {
      $$('#file_content_info').html(this.result);
      console.log("file read success:" + this.result);
    };
    reader.readAsText(file);
  }, onErrorReadFile);
}

//FileSystem加载失败回调  
function onErrorLoadFs(error) {
  console.log("文件系统加载失败！")
}

//文件夹创建失败回调  
function onErrorGetDir(error) {
  console.log("文件夹创建失败！")
}

//文件创建失败回调  
function onErrorCreateFile(error) {
  console.log("文件创建失败！")
}

//读取文件失败响应  
function onErrorReadFile() {
  console.log("文件读取失败!");
}


function saveFile(path, dataObj) {
  let dirs = path.split('/')
  let fileName = dirs.pop()

  return new Promise((resolve, reject) => {

        function errorHandler(e) {
          var msg = '';

          switch (e.code) {
            case FileError.QUOTA_EXCEEDED_ERR:
              msg = 'QUOTA_EXCEEDED_ERR';
              break;
            case FileError.NOT_FOUND_ERR:
              msg = 'NOT_FOUND_ERR';
              break;
            case FileError.SECURITY_ERR:
              msg = 'SECURITY_ERR';
              break;
            case FileError.INVALID_MODIFICATION_ERR:
              msg = 'INVALID_MODIFICATION_ERR';
              break;
            case FileError.INVALID_STATE_ERR:
              msg = 'INVALID_STATE_ERR';
              break;
            default:
              msg = 'Unknown Error';
              break;
          };

          console.log('Error: ' + msg);
          reject()
        }

        function createDir(rootDirEntry, folders) {
          // Throw out './' or '/' and move on to prevent something like '/foo/.//bar'.
          if (folders[0] == '.' || folders[0] == '') {
            folders = folders.slice(1);
          }
          rootDirEntry.getDirectory(folders[0], { create: true }, function(dirEntry) {
            // Recursively add the new subfolder (if we still have another to create).
            if (folders.length) {
              createDir(dirEntry, folders.slice(1));
            }
          }, errorHandler);
        }
        
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {
            createDir(fs, dirs)

            fs.root.getFile('log.txt', {
              create: true
            }, function(fileEntry) {

              //创建一个写入对象  
              fileEntry.createWriter(function(fileWriter) {

                //文件写入成功  
                fileWriter.onwriteend = function() {
                  console.log(`write to file:${path} success.`)
                  resolve()

                };

                //文件写入失败  
                fileWriter.onerror = function(e) {
                  console.log("Failed file write: " + e.toString());
                };

                //写入文件  
                fileWriter.write(dataObj);
              });

            }, errorHandler);

          }


        }

      }

      function readFile(path) {

        return new Promise((resolve, reject) => {

            function errorHandler(e) {
              var msg = '';

              switch (e.code) {
                case FileError.QUOTA_EXCEEDED_ERR:
                  msg = 'QUOTA_EXCEEDED_ERR';
                  break;
                case FileError.NOT_FOUND_ERR:
                  msg = 'NOT_FOUND_ERR';
                  break;
                case FileError.SECURITY_ERR:
                  msg = 'SECURITY_ERR';
                  break;
                case FileError.INVALID_MODIFICATION_ERR:
                  msg = 'INVALID_MODIFICATION_ERR';
                  break;
                case FileError.INVALID_STATE_ERR:
                  msg = 'INVALID_STATE_ERR';
                  break;
                default:
                  msg = 'Unknown Error';
                  break;
              };

              console.log('Error: ' + msg);
              reject()
            }

            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {
                createDir(fs, dirs)

                fs.root.getFile('log.txt', {
                  create: false
                }, function(fileEntry) {

                  fileEntry.file(function(file) {
                    var reader = new FileReader();

                    reader.onloadend = function(e) {
                      resolve(this.result)
                    };

                    reader.readAsText(file);
                  }, errorHandler);

                }, errorHandler);

              }

            })


        }

        function createDir(rootDirEntry, folders) {
          // Throw out './' or '/' and move on to prevent something like '/foo/.//bar'.
          if (folders[0] == '.' || folders[0] == '') {
            folders = folders.slice(1);
          }
          rootDirEntry.getDirectory(folders[0], { create: true }, function(dirEntry) {
            // Recursively add the new subfolder (if we still have another to create).
            if (folders.length) {
              createDir(dirEntry, folders.slice(1));
            }
          }, errorHandler);
        };

        function onInitFs(fs) {
          createDir(fs.root, path.split('/')); // fs.root is a DirectoryEntry.
        }

        window.requestFileSystem(window.TEMPORARY, 1024 * 1024, onInitFs, errorHandler);


        function errorHandler(e) {
          var msg = '';

          switch (e.code) {
            case FileError.QUOTA_EXCEEDED_ERR:
              msg = 'QUOTA_EXCEEDED_ERR';
              break;
            case FileError.NOT_FOUND_ERR:
              msg = 'NOT_FOUND_ERR';
              break;
            case FileError.SECURITY_ERR:
              msg = 'SECURITY_ERR';
              break;
            case FileError.INVALID_MODIFICATION_ERR:
              msg = 'INVALID_MODIFICATION_ERR';
              break;
            case FileError.INVALID_STATE_ERR:
              msg = 'INVALID_STATE_ERR';
              break;
            default:
              msg = 'Unknown Error';
              break;
          };

          console.log('Error: ' + msg);
        }


        function toArray(list) {
          return Array.prototype.slice.call(list || [], 0);
        }

        function listResults(entries) {
          // Document fragments can improve performance since they're only appended
          // to the DOM once. Only one browser reflow occurs.
          var fragment = document.createDocumentFragment();

          entries.forEach(function(entry, i) {
            var img = entry.isDirectory ? '<img src="folder-icon.gif">' :
              '<img src="file-icon.gif">';
            var li = document.createElement('li');
            li.innerHTML = [img, '<span>', entry.name, '</span>'].join('');
            fragment.appendChild(li);
          });

          document.querySelector('#filelist').appendChild(fragment);
        }

        function onInitFs(fs) {

          var dirReader = fs.root.createReader();
          var entries = [];

          // Call the reader.readEntries() until no more results are returned.
          var readEntries = function() {
            dirReader.readEntries(function(results) {
              if (!results.length) {
                listResults(entries.sort());
              } else {
                entries = entries.concat(toArray(results));
                readEntries();
              }
            }, errorHandler);
          };

          readEntries(); // Start reading dirs.

        }

        window.requestFileSystem(window.TEMPORARY, 1024 * 1024, onInitFs, errorHandler);

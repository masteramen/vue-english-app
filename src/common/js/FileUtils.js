export function saveFile(path, dataObj) {

  let dirs = path.split('/')
  let fileName = dirs.pop()
 console.log(dirs)

  console.log('save file to '+path)
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
          return reject(e)
        }

        function createDir(rootDirEntry, folders) {
          if(!folders||folders.length<=0)return;
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
                      createDir(fs.root, dirs)

                      fs.root.getFile(path, {
                        create: true
                      }, function(fileEntry) {

                                  //创建一个写入对象  
                                  fileEntry.createWriter(function(fileWriter) {
                                      //文件写入成功  
                                      fileWriter.onwriteend = function() {
                                        console.log(`write to file:${path} success.`)
                                        resolve(path)
                                      };

                                      //文件写入失败  
                                      fileWriter.onerror = function(e) {
                                        console.log("Failed file write: " + e.toString());
                                      };
                                      //写入文件  
                                      fileWriter.write(dataObj);
                                  });

                      }, errorHandler);

          },errorHandler)


        })

}

export function readFile(path) {

console.log('call readFile:'+path)
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
        console.log('read file:'+path)
          fs.root.getFile(path, {
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

        

      })

})
}


export function getFileUrl(path)
{
  console.log('getFIleUrl:'+path)
  return new Promise((resolve,reject)=>{
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

            fs.root.getFile(path, {
              create: false
            }, function(fileEntry) {

              fileEntry.file(function(file) {
                    resolve(file.localURL)

              }, errorHandler);

            }, errorHandler);

          }

  )
        })
}




function downloadFile(url, headers) {
  console.log('downloadfile...' + url)
  return new Promise((resolve, reject) => {
    let filePath = +new Date() + '.tmp'

    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {

      console.log(url + '=>' + filePath)

      //
      fs.root.getFile(filePath, { create: true }, function(fileEntry) {

        fileEntry.file(f => {


          var ft = new FileTransfer();
          var fileURL = fileEntry.toURL();
          //监听下载进度  
          ft.onprogress = function(e) {
            //console.info(e);  
            if (e.lengthComputable) {
              console.log('当前进度：' + e.loaded / e.total);
            }
          }

          ft.download(url, fileURL, function(entry) {
              console.log('download success');
              console.info(entry);
              console.log('location:' + entry.toURL());

              fileEntry.file(f => {

                if (f.size > 0) {
                  //console.log('file exists, size:'+f.size)
                  console.log(f)
                  console.log(fileEntry.toURL())
                  console.log(f.localURL)

                  var reader = new FileReader();

                  reader.onloadend = function(e) {
                    resolve(this.result)
                  };

                  reader.readAsText(f);

                }
              })
              //resolve(entry.toURL())

            }, function(err) {
              console.log("download！");
              console.info(err);
              //reject(url)
            }, null, // or, pass false  
            {
              headers: headers
              //headers: {  
              //    "Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="  
              //}  
            }
          );

          console.log('download file')

        })

      })
      //



    }, (e) => {
      console.log('getFile error:' + e)
      reject(url)
    });


  }, (e) => {
    console.log('requestFileSystem:' + e)
    reject(url)
  })


}


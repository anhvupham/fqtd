using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;
using System.Drawing;
using System.Drawing.Drawing2D;



namespace fqtd.Utils
{
    public static class FileUpload
    {
        public static char DirSeparator = System.IO.Path.DirectorySeparatorChar;

        public static string UploadFile(HttpPostedFileBase file, string full_path)
        {
            //string full_path = "";
            string fileName = file.FileName.Replace(" ", "_").Replace("-", "_");
            try
            {
                // Check if we have a file
                if (null == file) return "";
                // Make sure the file has content
                if (!(file.ContentLength > 0)) return "";


                string fileExt = Path.GetExtension(file.FileName);

                // Make sure we were able to determine a proper extension
                if (null == fileExt) return "";

                // Check if the directory we are saving to exists
                if (!Directory.Exists(full_path))
                {
                    // if it doesn't exist, create the directory
                    Directory.CreateDirectory(full_path);
                }

                file.SaveAs(Path.Combine(full_path, fileName));

                // Save our thumbnail as well
                //ResizeImage(file, 150, 100, full_path);
            }
            catch (Exception e) { fileName = "Khong dc upload nua roi"+e.Message + "-----" + full_path; }
            // Return the filename
            return fileName;
        }
        public static string UploadFile(HttpPostedFileBase file, string file_name, string full_path)
        {
            //string full_path = "";
            
            try
            {
                // Check if we have a file
                if (null == file) return "";
                // Make sure the file has content
                if (!(file.ContentLength > 0)) return "";


                string fileExt = Path.GetExtension(file.FileName);

                // Make sure we were able to determine a proper extension
                if (null == fileExt) return "";

                // Check if the directory we are saving to exists
                if (!Directory.Exists(full_path))
                {
                    // if it doesn't exist, create the directory
                    Directory.CreateDirectory(full_path);
                }

                file.SaveAs(Path.Combine(full_path, file_name));

                // Save our thumbnail as well
                //ResizeImage(file, 150, 100, full_path);
            }
            catch (Exception e) { file_name = e.Message + "-----" + full_path; }
            // Return the filename
            return file_name;
        }

        public static void DeleteFile(string fileName, string full_path)
        {
            // Don't do anything if there is no name
            if (fileName.Length == 0) return;

            // Set our full path for deleting
            string path = full_path + fileName;
            //string thumbPath = path.Replace("Uploads", "Uploads\\Thumbnails");

            RemoveFile(path);
            //RemoveFile(thumbPath);
        }

        private static void RemoveFile(string path)
        {
            // Check if our file exists
            if (File.Exists(path))
            {
                // Delete our file
                File.Delete(path);
            }
        }

        public static void ResizeImage(HttpPostedFileBase file, int width, int height, string full_path)
        {
            string thumbnailDirectory = String.Format(@"{0}{1}{2}", full_path, DirSeparator, "Thumbnails");

            // Check if the directory we are saving to exists
            if (!Directory.Exists(thumbnailDirectory))
            {
                // If it doesn't exist, create the directory
                Directory.CreateDirectory(thumbnailDirectory);
            }

            // Final path we will save our thumbnail
            string imagePath = String.Format(@"{0}{1}{2}", thumbnailDirectory, DirSeparator, file.FileName);
            // Create a stream to save the file to when we're done resizing
            FileStream stream = new FileStream(imagePath, FileMode.OpenOrCreate);

            // Convert our uploaded file to an image
            Image OrigImage = Image.FromStream(file.InputStream);
            // Create a new bitmap with the size of our thumbnail
            Bitmap TempBitmap = new Bitmap(width, height);

            // Create a new image that contains are quality information
            Graphics NewImage = Graphics.FromImage(TempBitmap);
            NewImage.CompositingQuality = CompositingQuality.HighQuality;
            NewImage.SmoothingMode = SmoothingMode.HighQuality;
            NewImage.InterpolationMode = InterpolationMode.HighQualityBicubic;

            // Create a rectangle and draw the image
            Rectangle imageRectangle = new Rectangle(0, 0, width, height);
            NewImage.DrawImage(OrigImage, imageRectangle);

            // Save the final file
            TempBitmap.Save(stream, OrigImage.RawFormat);

            // Clean up the resources
            NewImage.Dispose();
            TempBitmap.Dispose();
            OrigImage.Dispose();
            stream.Close();
            stream.Dispose();
        }

    }

}
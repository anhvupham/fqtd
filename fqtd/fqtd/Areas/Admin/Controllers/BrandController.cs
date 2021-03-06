﻿using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.Entity.Validation;
using System.Linq;
using System.Linq.Dynamic;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;
using fqtd.Utils;
using fqtd.Areas.Admin.Models;
using Newtonsoft.Json;
using System.Configuration;
using PagedList;
using System.IO;

namespace fqtd.Areas.Admin.Controllers
{
    public class BrandController : Controller
    {
        private fqtdEntities db = new fqtdEntities();

        //
        // GET: /Admin/Brands/
        //[OutputCache(CacheProfile = "Aggressive", VaryByParam = "page;keyword", Location = System.Web.UI.OutputCacheLocation.Client)]
        [Authorize]
        public ActionResult Index(string keyword = "", string sortOrder="", int page = 1)
        {
            var result = from a in db.Brands where a.IsActive && (a.BrandName.Contains(keyword) || a.BrandName_EN.Contains(keyword)) select a;

            ViewBag.BrandName = sortOrder == "BrandName" ? "BrandName desc" : "BrandName";
            ViewBag.CreateTime = sortOrder == "CreateDate" ? "CreateDate desc" : "CreateDate";
            ViewBag.UpdateTime = sortOrder == "ModifyDate" ? "ModifyDate desc" : "ModifyDate";
            if (sortOrder == "") sortOrder = "BrandName";
            result = result.OrderBy(sortOrder);
            ViewBag.CurrentKeyword = keyword;
            int maxRecords = 20;
            int currentPage = page;
            ViewBag.CurrentPage = page;
            TempData["CurrentKeyword"] = keyword;
            TempData["CreateTime"] = page;
            ViewBag.ItemCount = result.Count();
            return View(result.ToPagedList(currentPage, maxRecords));
        }


        public ActionResult BrandList(int vn0_EN1 = 0)
        {
            var brands = db.Brands.Where(a => a.IsActive && a.IsShow).Include(b => b.tbl_Categories);
            JsonNetResult jsonNetResult = new JsonNetResult();
            jsonNetResult.Formatting = Formatting.Indented;
            jsonNetResult.Data = from a in brands
                                 orderby a.BrandName
                                 select new { a.BrandID, a.BrandName, a.Description };
            if (vn0_EN1 == 1)
                jsonNetResult.Data = from a in brands
                                     orderby a.BrandName_EN
                                     select new { a.BrandID, BrandName = a.BrandName_EN, Description = a.Description_EN };
            return jsonNetResult;
        }

        public ActionResult BrandsByCategory(int id = -1, int vn0_EN1 = 0)
        {
            var brands = from b in db.Brands
                         //join c in db.tbl_Brand_Categories on new { BrandID = b.BrandID, CategoryID = b.CategoryID } equals new { BrandID=c.BrandID, CategoryID = id }
                         //where (id == -1  || b.CategoryID == id) && b.IsActive
                         from c in db.tbl_Brand_Categories.Where(a => a.CategoryID == id && a.BrandID == b.BrandID).DefaultIfEmpty()
                         where (id == -1 || b.CategoryID == id || c.CategoryID == id) && b.IsActive && b.IsShow
                         select b;
            //db.Brands.Where(a => a.IsActive && (id == -1 || a.CategoryID == id)).Include(b => b.tbl_Categories);
            JsonNetResult jsonNetResult = new JsonNetResult();
            jsonNetResult.Formatting = Formatting.Indented;
            jsonNetResult.Data = from a in brands
                                 orderby a.BrandName
                                 select new { a.BrandID, a.BrandName, a.Description };
            if (vn0_EN1 == 1)
                jsonNetResult.Data = from a in brands
                                     orderby a.BrandName_EN
                                     select new { a.BrandID, BrandName = a.BrandName_EN, Description = a.Description_EN };

            return jsonNetResult;
        }

        //
        // GET: /Admin/Brands/Details/5

        [Authorize]
        public ActionResult Details(int id = 0)
        {
            Brands brands = db.Brands.Find(id);
            if (brands == null)
            {
                return HttpNotFound();
            }
            return View(brands);
        }

        //
        // GET: /Admin/Brands/Create

        [Authorize]
        public ActionResult Create()
        {
            ViewBag.CategoryID = new SelectList(db.Categories.Where(a => a.IsActive), "CategoryID", "CategoryName");
            ViewBag.BrandTypeID = new SelectList(db.BrandTypes.Where(a => a.IsActive), "BrandTypeID", "BrandTypeName");
            return View();
        }

        //
        // POST: /Admin/Brands/Create

        [ValidateAntiForgeryToken]
        [HttpPost, ValidateInput(false)]
        [Authorize]
        public ActionResult Create(Brands brands, string Command, HttpPostedFileBase icon, HttpPostedFileBase logo)
        {
            if (db.Brands.Where(a => a.IsActive && (a.BrandName == brands.BrandName || a.BrandName_EN == brands.BrandName_EN)).Count() > 0)
            {
                ModelState.AddModelError("BrandName", "Already Exists Brand name");
            }
            else if (ModelState.IsValid)
            {
                brands.IsActive = true;
                brands.CreateDate = DateTime.Now;
                brands.CreateUser = User.Identity.Name;
                string filesPath = "", full_path = "", full_path_logo = "";
                if (icon != null)
                {
                    char DirSeparator = System.IO.Path.DirectorySeparatorChar;
                    filesPath = ConfigurationManager.AppSettings["BrandMarkerIconLocation"];
                    full_path = Server.MapPath(filesPath).Replace("Brands", "").Replace("Admin", "");
                    brands.MarkerIcon = FileUpload.UploadFile(icon, full_path);
                }
                if (logo != null)
                {
                    char DirSeparator = System.IO.Path.DirectorySeparatorChar;
                    filesPath = ConfigurationManager.AppSettings["BrandLogoLocation"];
                    full_path_logo = Server.MapPath(filesPath).Replace("Admin", "");
                    brands.Logo = FileUpload.UploadFile(logo, full_path_logo);
                }

                db.Brands.Add(brands);
                db.SaveChanges();
                if (icon != null)
                {
                    string filename = brands.BrandID + "_" + icon.FileName.Replace(" ", "_").Replace("-", "_");
                    if (System.IO.File.Exists(Path.Combine(full_path, filename)))
                        System.IO.File.Delete(Path.Combine(full_path, filename));
                    brands.MarkerIcon = filename;// FileUpload.UploadFile(icon, filename, full_path);
                    System.IO.File.Move(Path.Combine(full_path, icon.FileName), Path.Combine(full_path, filename));
                    db.Entry(brands).State = EntityState.Modified;
                    db.SaveChanges();
                }
                if (logo != null)
                {
                    string filename = brands.BrandID + "_" + logo.FileName.Replace(" ", "_").Replace("-", "_");
                    if (System.IO.File.Exists(Path.Combine(full_path_logo, filename)))
                        System.IO.File.Delete(Path.Combine(full_path_logo, filename));
                    brands.Logo = filename;// FileUpload.UploadFile(logo, filename, full_path);
                    System.IO.File.Move(Path.Combine(full_path_logo, logo.FileName), Path.Combine(full_path_logo, filename));
                    db.Entry(brands).State = EntityState.Modified;
                    db.SaveChanges();
                }
                if (Command == "Create2ImageList")
                    return RedirectToAction("ImageList", new {id=brands.BrandID });
                else
                    if (Command == "Create2Property")
                        return RedirectToAction("BrandProperties", new { id = brands.BrandID });
                    else
                        if (Command == "Create2Category")
                            return RedirectToAction("BrandCategories", new { id = brands.BrandID });
                        else
                            return RedirectToAction("Index", new { keyword = TempData["CurrentKeyword"], page = TempData["CurrentPage"] });
            }

            ViewBag.CategoryID = new SelectList(db.Categories.Where(a => a.IsActive), "CategoryID", "CategoryName", brands.CategoryID);
            ViewBag.BrandTypeID = new SelectList(db.BrandTypes.Where(a => a.IsActive), "BrandTypeID", "BrandTypeName", brands.BrandTypeID);
            return View(brands);
        }

        //
        // GET: /Admin/Brands/Edit/5

        [Authorize]
        public ActionResult Edit(int id = 0)
        {
            Brands brands = db.Brands.Find(id);
            if (brands == null)
            {
                return HttpNotFound();
            }

            ViewBag.CategoryID = new SelectList(db.Categories.Where(a => a.IsActive), "CategoryID", "CategoryName", brands.CategoryID);
            ViewBag.BrandTypeID = new SelectList(db.BrandTypes.Where(a => a.IsActive), "BrandTypeID", "BrandTypeName", brands.BrandTypeID);
            return View(brands);
        }

        //
        // POST: /Admin/Brands/Edit/5

        [Authorize]
        [ValidateAntiForgeryToken]
        [HttpPost, ValidateInput(false)]
        public ActionResult Edit(Brands brands, string Command, HttpPostedFileBase icon, HttpPostedFileBase logo)
        {
            if (db.Brands.Where(a => a.IsActive && a.BrandID != brands.BrandID && (a.BrandName == brands.BrandName || a.BrandName_EN == brands.BrandName_EN)).Count() > 0)
            {
                ModelState.AddModelError("BrandName", "Already Exists Brand name");
            }
            else if (ModelState.IsValid)
            {
                brands.ModifyDate = DateTime.Now;
                brands.ModifyUser = User.Identity.Name;
                string filesPath = "", full_path = "";
                string filesPath_logo = "", full_path_logo = "";
                string marker = brands.MarkerIcon; string oldlogo = brands.Logo;
                if (icon != null)
                {
                    char DirSeparator = System.IO.Path.DirectorySeparatorChar;
                    filesPath = ConfigurationManager.AppSettings["BrandMarkerIconLocation"];
                    full_path = Server.MapPath(filesPath).Replace("Brands", "").Replace("Admin", "");
                    brands.MarkerIcon = FileUpload.UploadFile(icon, full_path);
                }
                if (logo != null)
                {
                    char DirSeparator = System.IO.Path.DirectorySeparatorChar;
                    filesPath_logo = ConfigurationManager.AppSettings["BrandLogoLocation"];
                    full_path_logo = Server.MapPath(filesPath_logo).Replace("Brands", "").Replace("Admin", "");
                    brands.Logo = FileUpload.UploadFile(logo, full_path_logo);
                }

                db.Entry(brands).State = EntityState.Modified;
                db.SaveChanges();
                if (marker + "" != "" && marker != null)
                    FileUpload.DeleteFile(marker, full_path);
                if (oldlogo + "" != "" && logo != null)
                    FileUpload.DeleteFile(oldlogo, full_path_logo);

                if (icon != null)
                {
                    string filename = brands.BrandID + "_" + icon.FileName.Replace(" ", "_").Replace("-", "_");
                    if (System.IO.File.Exists(Path.Combine(full_path, filename)))
                        System.IO.File.Delete(Path.Combine(full_path, filename));
                    brands.MarkerIcon = filename;// FileUpload.UploadFile(logo, filename, full_path);
                    System.IO.File.Move(Path.Combine(full_path, icon.FileName), Path.Combine(full_path, filename));
                    db.Entry(brands).State = EntityState.Modified;
                    db.SaveChanges();
                }
                if (logo != null)
                {
                    string filename = brands.BrandID + "_" + logo.FileName.Replace(" ", "_").Replace("-", "_");
                    if (System.IO.File.Exists(Path.Combine(full_path_logo, filename)))
                        System.IO.File.Delete(Path.Combine(full_path_logo, filename));
                    brands.Logo = filename;// FileUpload.UploadFile(logo, filename, full_path);
                    System.IO.File.Move(Path.Combine(full_path_logo, logo.FileName), Path.Combine(full_path_logo, filename));
                    db.Entry(brands).State = EntityState.Modified;
                    db.SaveChanges();
                }
                //Console.Write(TempData["CurrentKeyword"] + "-" + TempData["CurrentPage"]);
                if (Command == "Save2ImageList")
                    return RedirectToAction("ImageList", new { id = brands.BrandID });
                else
                    if (Command == "Save2Property")
                        return RedirectToAction("BrandProperties", new { id = brands.BrandID });
                    else
                        if (Command == "Save2Category")
                            return RedirectToAction("BrandCategories", new { id = brands.BrandID });
                        else
                            return RedirectToAction("Index", new { keyword = TempData["CurrentKeyword"], page = TempData["CurrentPage"] });
            }
            ViewBag.CategoryID = new SelectList(db.Categories.Where(a => a.IsActive), "CategoryID", "CategoryName", brands.CategoryID);
            ViewBag.BrandTypeID = new SelectList(db.BrandTypes.Where(a => a.IsActive), "BrandTypeID", "BrandTypeName", brands.BrandTypeID);
            return View(brands);
        }

        //
        // GET: /Admin/Brands/Delete/5




        [Authorize]
        public ActionResult Delete(int id = 0)
        {
            Brands brands = db.Brands.Find(id);
            if (brands == null)
            {
                return HttpNotFound();
            }
            return View(brands);
        }

        //
        // POST: /Admin/Brands/Delete/5

        [Authorize]
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public ActionResult DeleteConfirmed(int id)
        {
            Brands brands = db.Brands.Find(id);

            brands.IsActive = false;
            brands.DeleteDate = DateTime.Now;
            brands.DeleteUser = User.Identity.Name;
            db.Entry(brands).State = EntityState.Modified;
            db.SaveChanges();
            return RedirectToAction("Index", new { keyword = TempData["CurrentKeyword"], page = TempData["CurrentPage"] });
        }



        [Authorize]
        public ActionResult BrandCategories(int id = 0)
        {


            var brand = db.Brands.Find(id);
            if (brand != null)
            {
                ViewBag.BrandName = brand.BrandName;
                ViewBag.CategoryID = new SelectList(db.Categories.Where(a => a.IsActive), "CategoryID", "CategoryName", brand.CategoryID);
            }
            else ViewBag.CategoryID = new SelectList(db.Categories.Where(a => a.IsActive), "CategoryID", "CategoryName");
            var result = db.SP_Brand_Categories(id).OrderBy(a => a.CategoryName);
            TempData["BrandID"] = id;
            return View(result);
        }
        [HttpPost]
        [Authorize]
        [ValidateAntiForgeryToken]
        public ActionResult BrandCategories(string[] MyCheckList, string Command)
        {
            int BrandID = Convert.ToInt32(TempData["BrandID"]);

            db.SP_RemoveBrandCategories(BrandID);

            var CID = Request.Form["CategoryID"];
            var brand = db.Brands.Find(BrandID);
            if (brand != null)
            {
                brand.CategoryID = Convert.ToInt32(CID);
                db.Entry(brand).State = EntityState.Modified;
            }
            db.SaveChanges();
            if (MyCheckList != null && MyCheckList.Length > 0)
                foreach (var item in MyCheckList)
                {
                    int CategoryID = Convert.ToInt32(item);
                    var result = db.tbl_Brand_Categories.Where(a => a.BrandID == BrandID && a.CategoryID == CategoryID);
                    BrandCategories ip = result.FirstOrDefault();
                    if (ip != null)
                    {
                        ip.Checked = true;
                        db.Entry(ip).State = EntityState.Modified;
                    }
                    else
                    {
                        ip = new BrandCategories();
                        ip.BrandID = BrandID;
                        ip.CategoryID = CategoryID;
                        ip.Checked = true;
                        db.tbl_Brand_Categories.Add(ip);
                    }
                }
            db.SaveChanges();
            TempData["BrandID"] = null;
            ViewBag.CategoryID = new SelectList(db.Categories, "CategoryID", "CategoryName");

            if (Command == "Save2ImageList")
                return RedirectToAction("ImageList", new { id = brand.BrandID });
            else
                if (Command == "Save2Property")
                    return RedirectToAction("BrandProperties", new { id = brand.BrandID });
                else
                    if (Command == "Save2Category")
                        return RedirectToAction("BrandCategories", new { id = brand.BrandID });
                    else
                        return RedirectToAction("Index", new { keyword = TempData["CurrentKeyword"], page = TempData["CurrentPage"] });
        }


        [Authorize]
        public ActionResult BrandProperties(int id = 0)
        {

            var brand = db.Brands.Find(id);
            if (brand != null) ViewBag.BrandName = brand.BrandName;
            var result = db.SP_Brand_Properties(id);
            TempData["BrandID"] = id;
            //TempData["CurrentKeyword"] = keyword;
            //TempData["CurrentPage"] = page;
            return View(result);
        }
        [HttpPost]
        [Authorize]
        [ValidateAntiForgeryToken]
        public ActionResult BrandProperties(string[] MyCheckList, string Command)
        {
            int BrandID = Convert.ToInt32(TempData["BrandID"]);

            db.SP_RemoveBrandProperties(BrandID);

            db.SaveChanges();
            foreach (var item in MyCheckList)
            {
                int PropertyID = Convert.ToInt32(item);
                var result = db.tbl_Brand_Properties.Where(a => a.BrandID == BrandID && a.PropertyID == PropertyID);
                tbl_Brand_Properties ip = result.FirstOrDefault();
                if (ip != null)
                {
                    ip.PropertyValue = true;
                    db.Entry(ip).State = EntityState.Modified;
                }
                else
                {
                    ip = new tbl_Brand_Properties();
                    ip.BrandID = BrandID;
                    ip.PropertyID = PropertyID;
                    ip.PropertyValue = true;
                    db.tbl_Brand_Properties.Add(ip);
                }
                db.SaveChanges();
                TempData["BrandID"] = null;
            }
            ViewBag.CategoryID = new SelectList(db.Categories, "CategoryID", "CategoryName");
            if (Command == "Save2ImageList")
                return RedirectToAction("ImageList", new { id = BrandID });
            else
                if (Command == "Save2Property")
                    return RedirectToAction("BrandProperties", new { id = BrandID });
                else
                    if (Command == "Save2Category")
                        return RedirectToAction("BrandCategories", new { id = BrandID });
                    else
                        return RedirectToAction("Index", new { keyword = TempData["CurrentKeyword"], page = TempData["CurrentPage"] });
        }

        [Authorize]
        public ViewResult ImageList(int id)
        {
            Brands item = db.Brands.Find(id);
            string path = ConfigurationManager.AppSettings["BrandImageLocation"] + "\\" + item.BrandID;
            path = Server.MapPath(path);
            List<string> list = new List<string>();
            if (Directory.Exists(path))
            {
                string[] files = Directory.GetFiles(path);

                foreach (string s in files)
                {
                    string filename = Path.GetFileName(s);
                    if (!System.IO.File.Exists(s.Replace(" ", "_").Replace("-", "_")))
                        //System.IO.File.Delete(s.Replace(" ", "_").Replace("-", "_"));
                        System.IO.File.Move(s, s.Replace(" ", "_").Replace("-", "_"));
                    if (filename.ToLower().IndexOf(".jpg") >= 0 || filename.ToLower().IndexOf(".png") >= 0 || filename.ToLower().IndexOf(".gif") >= 0)
                        list.Add(ConfigurationManager.AppSettings["BrandImageLocation"].Replace("~", "../../../..") + "/" + item.BrandID + "/" + filename.Replace(" ", "_").Replace("-", "_"));

                }
            }
            ViewBag.ImageList = list;
            return View(item);
        }
        [HttpPost]
        [Authorize]
        public ActionResult AddImages(int id, HttpPostedFileBase file)
        {
            var item = db.Brands.Find(id);
            if (ModelState.IsValid)
            {
                if (file != null)
                {
                    char DirSeparator = System.IO.Path.DirectorySeparatorChar;
                    string FilesPath = ConfigurationManager.AppSettings["BrandImageLocation"];
                    string full_path = Server.MapPath(FilesPath).Replace("AddImages", "").Replace(" ", "_").Replace("-", "_") + "\\" + item.BrandID;
                    FileUpload.UploadFile(file, full_path);
                }
                return RedirectToAction("ImageList", new { id = item.BrandID });
            }
            return View(item);
        }

        [Authorize]
        public ActionResult DeleteImage(int id, string image)
        {
            image = image.Replace("../", "");

            string FilesPath = ConfigurationManager.AppSettings["BrandImageLocation"];
            string full_path = Server.MapPath(FilesPath);
            FilesPath = Path.Combine(full_path, id + "\\" + image.Substring(image.LastIndexOf('/') + 1));
            if (System.IO.File.Exists(FilesPath))
            {
                System.IO.File.Delete(FilesPath);
            }
            return RedirectToAction("ImageList", new { id = id });

        }
        protected override void Dispose(bool disposing)
        {
            db.Dispose();
            base.Dispose(disposing);
        }
    }
}
using System;
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
using PagedList;
using System.Configuration;

namespace fqtd.Areas.Admin.Controllers
{
    public class CategoriesController : Controller
    {
        private fqtdEntities db = new fqtdEntities();

        //
        // GET: /Category/
        [Authorize]
        public ActionResult Index(string keyword = "", int page = 1)
        {
            var result = from a in db.Categories where a.IsActive == true && (a.CategoryName.Contains(keyword) || a.CategoryName_EN.Contains(keyword)) select a;
            result = result.OrderBy("CategoryName");
            ViewBag.CurrentKeyword = keyword;
            int maxRecords = 20;
            int currentPage = page;
            ViewBag.CurrentPage = page;
            TempData["CurrentKeyword"] = keyword;
            TempData["CurrentPage"] = page;
            return View(result.ToPagedList(currentPage, maxRecords));
        }
        public ActionResult Categories(int vn0_en1 = 0)
        {
            var categories = db.Categories.Where(a => a.IsActive);
            JsonNetResult jsonNetResult = new JsonNetResult();
            jsonNetResult.Formatting = Formatting.Indented;
            jsonNetResult.Data = from a in categories
                                 select new { a.CategoryID, a.CategoryName };
            if (vn0_en1 == 1)
                jsonNetResult.Data = from a in categories
                                     select new { a.CategoryID, CategoryName = a.CategoryName_EN };

            return jsonNetResult;
        }

        //
        // GET: /Category/Details/5
        [Authorize]
        public ActionResult Details(int id = 0)
        {
            Categories Categories = db.Categories.Where(a => a.IsActive && a.CategoryID == id).FirstOrDefault();
            if (Categories == null)
            {
                return HttpNotFound();
            }
            return View(Categories);
        }

        //
        // GET: /Category/Create

        [Authorize]
        public ActionResult Create()
        {
            return View();
        }

        //
        // POST: /Category/Create

        [Authorize]
        [HttpPost, ValidateInput(false)]
        public ActionResult Create(Categories Categories, HttpPostedFileBase icon)
        {
            if (ModelState.IsValid)
            {
                Categories.IsActive = true;
                Categories.CreateDate = DateTime.Now;
                Categories.CreateUser = User.Identity.Name;
                string filesPath = "", full_path = "";
                if (icon != null)
                {
                    char DirSeparator = System.IO.Path.DirectorySeparatorChar;
                    filesPath = ConfigurationManager.AppSettings["CategoryMarkerIconLocaion"];
                    full_path = Server.MapPath(filesPath).Replace("Brands", "").Replace("Admin", "");
                    Categories.MarkerIcon = FileUpload.UploadFile(icon, full_path);
                }
                db.Categories.Add(Categories);
                db.SaveChanges();
                if (icon != null)
                {
                    string filename = Categories.CategoryID + "_" + icon.FileName.Replace(" ", "_").Replace("-", "_");
                    Categories.MarkerIcon = FileUpload.UploadFile(icon, filename, full_path);
                    db.Entry(Categories).State = EntityState.Modified;
                    db.SaveChanges();
                }

                return RedirectToAction("Index", new { keyword = TempData["CurrentKeyword"], page = TempData["CurrentPage"] });
            }

            return View(Categories);
        }

        //
        // GET: /Category/Edit/5

        [Authorize]
        public ActionResult Edit(int id = 0)
        {
            Categories Categories = db.Categories.Where(a => a.IsActive && a.CategoryID == id).FirstOrDefault();
            if (Categories == null)
            {
                return HttpNotFound();
            }
            return View(Categories);
        }

        //
        // POST: /Category/Edit/5

        [Authorize]
        [HttpPost, ValidateInput(false)]
        public ActionResult Edit(Categories Categories, HttpPostedFileBase icon)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    Categories.ModifyDate = DateTime.Now;
                    Categories.ModifyUser = User.Identity.Name;
                    if (Categories.CreateUser == null || Categories.CreateUser == "") Categories.CreateUser = "import";
                    string filesPath = "", full_path = "";
                    string marker = Categories.MarkerIcon;
                    if (icon != null)
                    {
                        char DirSeparator = System.IO.Path.DirectorySeparatorChar;
                        filesPath = ConfigurationManager.AppSettings["CategoryMarkerIconLocaion"];
                        full_path = Server.MapPath(filesPath).Replace("Brands", "").Replace("Admin", "");
                        Categories.MarkerIcon = FileUpload.UploadFile(icon, full_path);
                    }

                    db.Entry(Categories).State = EntityState.Modified;
                    db.SaveChanges();

                    if (marker + "" != "")
                        FileUpload.DeleteFile(marker, full_path);

                    if (icon != null)
                    {
                        string filename = Categories.CategoryID + "_" + icon.FileName.Replace(" ", "_").Replace("-", "_");
                        Categories.MarkerIcon = FileUpload.UploadFile(icon, filename, full_path);
                        db.Entry(Categories).State = EntityState.Modified;
                        db.SaveChanges();
                    }

                    return RedirectToAction("Index", new { keyword = TempData["CurrentKeyword"], page = TempData["CurrentPage"] });
                }
            }
            catch (System.Data.Entity.Validation.DbEntityValidationException e)
            {
                var outputLines = new List<string>();
                foreach (var eve in e.EntityValidationErrors)
                {
                    outputLines.Add(string.Format(
                        "Entity of type \"{1}\" in state \"{2}\" has the following validation errors:",
                         eve.Entry.Entity.GetType().Name, eve.Entry.State));
                    foreach (var ve in eve.ValidationErrors)
                    {
                        outputLines.Add(string.Format(
                            "- Property: \"{0}\", Error: \"{1}\"",
                            ve.PropertyName, ve.ErrorMessage));
                    }
                }
                foreach (var error in outputLines)
                    HtmlHelpers.WriteErrorLogs(error);
                throw;
            }
            return View(Categories);
        }

        //
        // GET: /Category/Delete/5

        [Authorize]
        public ActionResult Delete(int id = 0)
        {
            Categories Categories = db.Categories.Where(a => a.IsActive && a.CategoryID == id).FirstOrDefault();
            if (Categories == null)
            {
                return HttpNotFound();
            }
            return View(Categories);
        }

        //
        // POST: /Category/Delete/5

        [Authorize]
        [HttpPost, ActionName("Delete")]
        public ActionResult DeleteConfirmed(int id)
        {
            Categories Categories = db.Categories.Where(a => a.IsActive && a.CategoryID == id).FirstOrDefault();
            if (Categories == null)
            {
                return HttpNotFound();
            }
            Categories.IsActive = false;
            Categories.DeleteDate = DateTime.Now;
            Categories.DeleteUser = User.Identity.Name;
            db.Entry(Categories).State = EntityState.Modified;
            db.SaveChanges();
            return RedirectToAction("Index", new { keyword = TempData["CurrentKeyword"], page = TempData["CurrentPage"] });
        }

        protected override void Dispose(bool disposing)
        {
            db.Dispose();
            base.Dispose(disposing);
        }
    }
}
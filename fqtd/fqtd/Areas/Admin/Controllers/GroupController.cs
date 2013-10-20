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
    public class GroupController : Controller
    {
        private fqtdEntities db = new fqtdEntities();

        //
        // GET: /Group/
        [Authorize]
        [OutputCache(CacheProfile = "Aggressive", VaryByParam = "page;keyword", Location = System.Web.UI.OutputCacheLocation.Client)]
        public ActionResult Index(string keyword = "", int page = 1)
        {
            var result = from a in db.Groups where a.IsActive == true && (a.GroupName.Contains(keyword) || a.GroupName_EN.Contains(keyword)) select a;
            result = result.OrderBy("GroupName");
            ViewBag.CurrentKeyword = keyword;
            int maxRecords = 20;
            int currentPage = page;
            ViewBag.CurrentPage = page;
            ViewBag.ItemCount = result.Count();
            TempData["CurrentKeyword"] = keyword;
            TempData["CurrentPage"] = page;
            return View(result.ToPagedList(currentPage, maxRecords));
        }
        public ActionResult Groups(int vn0_EN1 = 0)
        {
            var Groups = db.Groups.Where(a => a.IsActive && a.IsShow);
            JsonNetResult jsonNetResult = new JsonNetResult();
            jsonNetResult.Formatting = Formatting.Indented;
            jsonNetResult.Data = from a in Groups
                                 orderby a.GroupName
                                 select new { a.GroupID, a.GroupName };
            if (vn0_EN1 == 1)
                jsonNetResult.Data = from a in Groups
                                     orderby a.GroupName_EN
                                     select new { a.GroupID, GroupName = a.GroupName_EN };

            return jsonNetResult;
        }

        //
        // GET: /Group/Details/5
        [Authorize]
        public ActionResult Details(int id = 0)
        {
            Groups Groups = db.Groups.Where(a => a.IsActive && a.GroupID == id).FirstOrDefault();
            if (Groups == null)
            {
                return HttpNotFound();
            }
            return View(Groups);
        }

        //
        // GET: /Group/Create

        [Authorize]
        public ActionResult Create()
        {
            return View();
        }

        //
        // POST: /Group/Create

        [Authorize]
        [HttpPost, ValidateInput(false)]
        public ActionResult Create(Groups Groups, HttpPostedFileBase icon)
        {
            if (db.Groups.Where(a => a.IsActive && (a.GroupName == Groups.GroupName || a.GroupName_EN == Groups.GroupName_EN)).Count() > 0)
            {
                ModelState.AddModelError("GroupName", "Already Exists Group name");
            }
            else if (ModelState.IsValid)
            {
                Groups.IsActive = true;
                Groups.CreateDate = DateTime.Now;
                Groups.CreateUser = User.Identity.Name;
                
                db.Groups.Add(Groups);
                db.SaveChanges();

                return RedirectToAction("Index", new { keyword = TempData["CurrentKeyword"], page = TempData["CurrentPage"] });
            }

            return View(Groups);
        }

        //
        // GET: /Group/Edit/5

        [Authorize]
        public ActionResult Edit(int id = 0)
        {
            Groups Groups = db.Groups.Where(a => a.IsActive && a.GroupID == id).FirstOrDefault();
            if (Groups == null)
            {
                return HttpNotFound();
            }
            return View(Groups);
        }

        //
        // POST: /Group/Edit/5

        [Authorize]
        [HttpPost, ValidateInput(false)]
        public ActionResult Edit(Groups Groups, HttpPostedFileBase icon)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    Groups.ModifyDate = DateTime.Now;
                    Groups.ModifyUser = User.Identity.Name;
                    if (Groups.CreateUser == null || Groups.CreateUser == "") Groups.CreateUser = "import";
                    
                    db.Entry(Groups).State = EntityState.Modified;
                    db.SaveChanges();


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
            return View(Groups);
        }

        //
        // GET: /Group/Delete/5

        [Authorize]
        public ActionResult Delete(int id = 0)
        {
            Groups Groups = db.Groups.Where(a => a.IsActive && a.GroupID == id).FirstOrDefault();
            if (Groups == null)
            {
                return HttpNotFound();
            }
            return View(Groups);
        }

        //
        // POST: /Group/Delete/5

        [Authorize]
        [HttpPost, ActionName("Delete")]
        public ActionResult DeleteConfirmed(int id)
        {
            Groups Groups = db.Groups.Where(a => a.IsActive && a.GroupID == id).FirstOrDefault();
            if (Groups == null)
            {
                return HttpNotFound();
            }
            Groups.IsActive = false;
            Groups.DeleteDate = DateTime.Now;
            Groups.DeleteUser = User.Identity.Name;
            db.Entry(Groups).State = EntityState.Modified;
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
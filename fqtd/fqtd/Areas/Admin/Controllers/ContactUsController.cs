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
    public class ContactUsController : Controller
    {
        private fqtdEntities db = new fqtdEntities();

        //
        // GET: /Admin/ContacUs/

        public ActionResult Index(string keyword = "", int page = 1)
        {
            var result = from a in db.ContactUS where   (a.CustomerName.Contains(keyword) || a.Phone.Contains(keyword)) select a;
            result = result.OrderBy("CustomerName");
            ViewBag.CurrentKeyword = keyword;
            int maxRecords = 20;
            int currentPage = page;
            ViewBag.CurrentPage = page;
            TempData["CurrentKeyword"] = keyword;
            TempData["CurrentPage"] = page;
            return View(result.ToPagedList(currentPage, maxRecords));
        }

        //
        // GET: /Admin/ContacUs/Details/5

        public ActionResult Details(int id = 0)
        {
            ContactUS contactus = db.ContactUS.Find(id);
            if (contactus == null)
            {
                return HttpNotFound();
            }
            return View(contactus);
        }

       

        //
        // GET: /Admin/ContacUs/Edit/5

        public ActionResult Edit(int id = 0)
        {
            ContactUS contactus = db.ContactUS.Find(id);
            if (contactus == null)
            {
                return HttpNotFound();
            }
            return View(contactus);
        }

        //
        // POST: /Admin/ContacUs/Edit/5

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Edit(ContactUS contactus)
        {
            if (ModelState.IsValid)
            {
                db.Entry(contactus).State = EntityState.Modified;
                db.SaveChanges();
                return RedirectToAction("Index");
            }
            return View(contactus);
        }

        //
        // GET: /Admin/ContacUs/Delete/5

        public ActionResult Delete(int id = 0)
        {
            ContactUS contactus = db.ContactUS.Find(id);
            if (contactus == null)
            {
                return HttpNotFound();
            }
            return View(contactus);
        }

        //
        // POST: /Admin/ContacUs/Delete/5

        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public ActionResult DeleteConfirmed(int id)
        {
            ContactUS contactus = db.ContactUS.Find(id);
            db.ContactUS.Remove(contactus);
            db.SaveChanges();
            return RedirectToAction("Index");
        }

        protected override void Dispose(bool disposing)
        {
            db.Dispose();
            base.Dispose(disposing);
        }
    }
}
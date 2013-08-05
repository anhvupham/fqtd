using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using fqtd.Areas.Admin.Models;

namespace fqtd.Areas.Admin.Controllers
{
    public class ContactUsController : Controller
    {
        private fqtdEntities db = new fqtdEntities();

        //
        // GET: /Admin/ContacUs/

        public ActionResult Index()
        {
            return View(db.ContactUS.ToList());
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
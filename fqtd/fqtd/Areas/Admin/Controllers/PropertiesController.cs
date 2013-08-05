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
    public class PropertiesController : Controller
    {
        private fqtdEntities db = new fqtdEntities();

        //
        // GET: /Admin/Properties/

        public ActionResult Index()
        {
            return View(db.Properties.ToList());
        }

        //
        // GET: /Admin/Properties/Details/5

        public ActionResult Details(int id = 0)
        {
            Properties properties = db.Properties.Find(id);
            if (properties == null)
            {
                return HttpNotFound();
            }
            return View(properties);
        }

        //
        // GET: /Admin/Properties/Create

        public ActionResult Create()
        {
            return View();
        }

        //
        // POST: /Admin/Properties/Create

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Create(Properties properties)
        {
            if (ModelState.IsValid)
            {
                properties.IsActive = true;
                properties.CreateDate = DateTime.Now;
                properties.CreateUser = User.Identity.Name;

                db.Properties.Add(properties);
                db.SaveChanges();
                return RedirectToAction("Index");
            }

            return View(properties);
        }

        //
        // GET: /Admin/Properties/Edit/5

        public ActionResult Edit(int id = 0)
        {
            Properties properties = db.Properties.Find(id);
            if (properties == null)
            {
                return HttpNotFound();
            }
            return View(properties);
        }

        //
        // POST: /Admin/Properties/Edit/5

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Edit(Properties properties)
        {
            if (ModelState.IsValid)
            {
                properties.ModifyDate = DateTime.Now;
                properties.ModifyUser = User.Identity.Name;

                db.Entry(properties).State = EntityState.Modified;
                db.SaveChanges();
                return RedirectToAction("Index");
            }
            return View(properties);
        }

        //
        // GET: /Admin/Properties/Delete/5

        public ActionResult Delete(int id = 0)
        {
            Properties properties = db.Properties.Find(id);
            if (properties == null)
            {
                return HttpNotFound();
            }
            return View(properties);
        }

        //
        // POST: /Admin/Properties/Delete/5

        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public ActionResult DeleteConfirmed(int id)
        {
            Properties properties = db.Properties.Find(id);
            db.Properties.Remove(properties);
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
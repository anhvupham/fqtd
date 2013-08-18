
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using fqtd.Areas.Admin.Models;

namespace fqtd.Areas.Admin.Controllers
{
    public class SystemContentController : Controller
    {

        private fqtdEntities db = new fqtdEntities();
        //
        // GET: /SystemContent/
        [Authorize]
        public ActionResult Index()
        {
            return View();
        }

        [Authorize]
        public ActionResult Edit(fqtd.Areas.Admin.Models.SystemContent id = 0)
        {
            tbl_SystemContent tbl_SystemContent = db.tbl_SystemContent.Find(id);
            if (tbl_SystemContent == null)
            {
                return HttpNotFound();
            }
            return View(tbl_SystemContent);
        }

        //
        // POST: /Order/Edit/5

        [Authorize]
        [HttpPost,ValidateInput(false)]
        public ActionResult Edit(tbl_SystemContent content)
        {
            if (ModelState.IsValid)
            {
                db.Entry(content).State = EntityState.Modified;
                db.SaveChanges();
                return RedirectToAction("Index");
            }
            return View(content);
        }
    }
}

﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using fqtd.Areas.Admin.Models;
using System.Configuration;
using fqtd.Utils;

namespace fqtd.Controllers
{
    public class HomeController : Controller
    {
        private fqtdEntities db = new fqtdEntities();
        public ActionResult Index()
        {
            ViewBag.URL = Request.Url.AbsoluteUri;
            ViewBag.keywords = ConfigurationManager.AppSettings["metakeywords"];
            ViewBag.description = ConfigurationManager.AppSettings["metakeydescription"];
            return View("Index");
        }
        
        public ActionResult Introduction()
        {
            tbl_SystemContent tbl_SystemContent = db.tbl_SystemContent.Find(SystemContent.Introduction);
            if (tbl_SystemContent == null)
            {
                return HttpNotFound();
            }
            return View(tbl_SystemContent);
        }
        public ActionResult TermAndConditionOfUse()
        {
            tbl_SystemContent tbl_SystemContent = db.tbl_SystemContent.Find(SystemContent.Tern4Use);
            if (tbl_SystemContent == null)
            {
                return HttpNotFound();
            }
            return View(tbl_SystemContent);
        }
        public ActionResult Policy()
        {
            tbl_SystemContent tbl_SystemContent = db.tbl_SystemContent.Find(SystemContent.Policy);
            if (tbl_SystemContent == null)
            {
                return HttpNotFound();
            }
            return View(tbl_SystemContent);
        }

        //
        // GET: /Admin/ContacUs/Create

        public ActionResult ContactUs()
        {
            return View();
        }

        //
        // POST: /Admin/ContacUs/Create

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult ContactUs(ContactUS contactus)
        {
            if (ModelState.IsValid)
            {
                contactus.ContactDate = DateTime.Now;
                db.ContactUS.Add(contactus);
                db.SaveChanges();

                MailClient.SendConfirm(contactus.Email, Url.Action("detail", "ContactUS", new {id=contactus.ContactID}),contactus.CustomerName);
                return RedirectToAction("Thanks");
            }

            return View(contactus);
        }
        public ActionResult Thanks()
        {
            return View();
        }

        public ActionResult Survey(int id)
        {
           var survey= db.Survey.Find(id);
           if (survey != null && survey.SurveyID > 0)
           {
               return View(survey);
           }
           else return View();
        }
    }
}

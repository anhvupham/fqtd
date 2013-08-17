using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace fqtd.Controllers
{
    public class DetailController : Controller
    {
        public ActionResult Index()
        {
            ViewBag.URL = Request.Url.OriginalString;
            ViewBag.keywords = ConfigurationManager.AppSettings["metakeywords"];
            ViewBag.description = ConfigurationManager.AppSettings["metakeydescription"];
            return View("Index");
        }      
       
    }
}

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
            ViewBag.URL = Request.Url.AbsoluteUri;
            ViewBag.keywords = ConfigurationManager.AppSettings["metakeywords"];
            ViewBag.description = ConfigurationManager.AppSettings["metakeydescription"];
            string temp = Request.Url.AbsoluteUri.Substring(Request.Url.AbsoluteUri.IndexOf("detail/")+7);
            temp = temp.Substring(0,temp.IndexOf("/"));
            int itemid = 0;
            int.TryParse(temp, out itemid);
            ViewBag.Item = new fqtd.Areas.Admin.Models.fqtdEntities().BrandItems.Find(itemid);

            return View("Index");
            
        }      
       
    }
}

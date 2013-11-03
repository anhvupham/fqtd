using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using fqtd.Areas.Admin.Models;
using fqtd.Utils;
using Newtonsoft.Json;

namespace fqtd.Areas.Admin.Controllers
{
    public class SurveyResultJson
    {
        public string Question { get; set; }
        public int VoteCount { get; set; }
        public double Percent { get; set; }
    }
    public class SurveyController : Controller
    {
        private fqtdEntities db = new fqtdEntities();

        //
        // GET: /Admin/Survey/

        public ActionResult Index()
        {
            return View(db.Survey.ToList());
        }

        //
        // GET: /Admin/Survey/Details/5

        public ActionResult Details(int id = 0)
        {
            Survey survey = db.Survey.Find(id);
            if (survey == null)
            {
                return HttpNotFound();
            }
            return View(survey);
        }

        //
        // GET: /Admin/Survey/Create

        public ActionResult Create()
        {
            return View();
        }

        public ActionResult AddQuestion(int SurveyID, string Question)
        {
            SurveyResult result = new SurveyResult();
            result.Question = Question;
            result.ServeyID = SurveyID;
            result.VoteCount = 0;
            db.SurveyResult.Add(result);
            db.SaveChanges();
            return RedirectToAction("Details", new { id = SurveyID });
        }
        public ActionResult RemoveQuestion(int QuestionID)
        {
            SurveyResult result = db.SurveyResult.Find(QuestionID);
            db.SurveyResult.Remove(result);
            db.SaveChanges();
            return RedirectToAction("Details", new { id = result.ServeyID });
        }

        public ActionResult SurveySubmit(string Command, int SurveyID, string[] MyCheckList, string Other)
        {
            if (Command == "Gửi")
            {
                foreach (string id in MyCheckList)
                {
                    int qID = Convert.ToInt32(id);
                    SurveyResult item = db.SurveyResult.Where(a => a.ServeyID == SurveyID && a.QuestionID == qID).FirstOrDefault();
                    if (item != null)
                    {
                        if (item.VoteCount == null)
                            item.VoteCount = 1;
                        else item.VoteCount += 1;
                        item.VoteLastTime = DateTime.Now;
                    }
                    db.Entry(item).State = EntityState.Modified;
                }
                db.SaveChanges();
            }
            else
            {
                SurveyOtherOpininon other = new SurveyOtherOpininon();
                other.SurveyID = SurveyID;
                other.OtherOpinion = Other;
                other.SumitTime = DateTime.Now;

                db.SurveyOtherOpininon.Add(other);
                db.SaveChanges();
            }
            return RedirectToAction("ViewResult", new { id = SurveyID });
        }
        public ActionResult ViewResult(int id)
        {
            Survey survey = db.Survey.Find(id);
            if (survey == null)
            {
                return HttpNotFound();
            }
            return View(survey);
        }
        public ActionResult JsonData(int id)
        {
            List<SurveyResultJson> results = new List<SurveyResultJson>();
            int total = db.SurveyResult.Where(a => a.ServeyID == id).Sum(a => a.VoteCount).Value;
            int OtherO = db.SurveyOtherOpininon.Where(a => a.SurveyID == id).Count();
            if (OtherO > 0)
            {
                SurveyResultJson result = new SurveyResultJson();
                result.Question = "Ý kiến khác";
                result.VoteCount = OtherO;
                result.Percent = Math.Round(Convert.ToDouble(OtherO) * 100 / (OtherO + total), 2);
                results.Add(result);
            }
            foreach (var item in db.SurveyResult.Where(a => a.ServeyID == id))
            {
                SurveyResultJson result = new SurveyResultJson();
                result.Question = item.Question;
                result.VoteCount = item.VoteCount.Value;
                result.Percent = Math.Round(Convert.ToDouble(item.VoteCount.Value) * 100 / (OtherO + total), 2);
                results.Add(result);
            }
            JsonNetResult jsonNetResult = new JsonNetResult();
            jsonNetResult.Formatting = Formatting.Indented;
            jsonNetResult.Data = results;
            return jsonNetResult;

        }

        //
        // POST: /Admin/Survey/Create

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Create(Survey survey)
        {
            if (ModelState.IsValid)
            {
                db.Survey.Add(survey);
                db.SaveChanges();
                return RedirectToAction("Index");
            }

            return View(survey);
        }

        //
        // GET: /Admin/Survey/Edit/5

        public ActionResult Edit(int id = 0)
        {
            Survey survey = db.Survey.Find(id);
            if (survey == null)
            {
                return HttpNotFound();
            }
            return View(survey);
        }

        //
        // POST: /Admin/Survey/Edit/5

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Edit(Survey survey)
        {
            if (ModelState.IsValid)
            {
                db.Entry(survey).State = EntityState.Modified;
                db.SaveChanges();
                return RedirectToAction("Index");
            }
            return View(survey);
        }

        //
        // GET: /Admin/Survey/Delete/5

        public ActionResult Delete(int id = 0)
        {
            Survey survey = db.Survey.Find(id);
            if (survey == null)
            {
                return HttpNotFound();
            }
            return View(survey);
        }

        //
        // POST: /Admin/Survey/Delete/5

        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public ActionResult DeleteConfirmed(int id)
        {
            Survey survey = db.Survey.Find(id);
            db.Survey.Remove(survey);
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